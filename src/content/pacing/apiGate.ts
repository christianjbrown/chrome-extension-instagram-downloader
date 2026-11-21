import { RefusedError } from "../../shared/refusal";
import { BlockedError } from "../errors";
import type { Budget, Sleeper, Gate } from "./ports";
import type { Pacing, WaitReporter } from "./pacing";

const text = {
  hourlyLimit: "Hourly request limit reached",
  slowDown: "Instagram asked us to slow down",
  blocked:
    "Instagram kept refusing requests, so the run stopped. Try again tomorrow.",
} as const;

// Every bulk API call goes through here: the hourly budget, a random delay,
// and a backoff when Instagram refuses. Any
// other failure is passed straight on, with its own message, rather than
// waited out.
export class ApiGate implements Gate {
  private refusals = 0;

  constructor(
    private readonly sleeper: Sleeper,
    private readonly budget: Budget,
    private readonly pacing: Pacing,
  ) {}

  async call<T>(
    request: () => Promise<T>,
    signal: AbortSignal,
    reporter: WaitReporter,
  ): Promise<T> {
    for (;;) {
      await this.budget.take(signal, (ms) => {
        reporter.waiting(text.hourlyLimit, ms);
      });
      await this.sleeper.between(this.pacing.apiDelayMs, signal);
      try {
        const result = await request();
        this.refusals = 0;
        return result;
      } catch (error) {
        if (!(error instanceof RefusedError)) throw error;
        await this.backOff(signal, reporter);
      }
    }
  }

  private async backOff(
    signal: AbortSignal,
    reporter: WaitReporter,
  ): Promise<void> {
    const wait = this.pacing.backoffMs[this.refusals];
    if (wait === undefined) {
      this.refusals = 0;
      throw new BlockedError(text.blocked);
    }
    this.refusals += 1;
    reporter.waiting(text.slowDown, wait);
    await this.sleeper.sleep(wait, signal);
  }
}
