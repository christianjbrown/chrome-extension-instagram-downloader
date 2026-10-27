import { BlockedError, isAbortError } from "../errors";
import type { HourlyBudget } from "./hourlyBudget";
import type { Pacing } from "./pacing";
import type { Sleeper } from "./sleeper";

export interface WaitReporter {
  waiting(reason: string, ms: number): void;
}

export interface Gate {
  call<T>(
    request: () => Promise<T>,
    signal: AbortSignal,
    reporter: WaitReporter,
  ): Promise<T>;
}

// Every bulk API call goes through here: the hourly budget, a random delay,
// and a backoff when Instagram refuses.
export class ApiGate implements Gate {
  private refusals = 0;

  constructor(
    private readonly sleeper: Sleeper,
    private readonly budget: HourlyBudget,
    private readonly pacing: Pacing,
  ) {}

  async call<T>(
    request: () => Promise<T>,
    signal: AbortSignal,
    reporter: WaitReporter,
  ): Promise<T> {
    for (;;) {
      await this.budget.take(signal, (ms) => {
        reporter.waiting("Hourly request limit reached", ms);
      });
      await this.sleeper.between(this.pacing.apiDelayMs, signal);
      try {
        const result = await request();
        this.refusals = 0;
        return result;
      } catch (error) {
        if (isAbortError(error)) throw error;
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
      throw new BlockedError(
        "Instagram kept refusing requests, so the run stopped. Try again tomorrow.",
      );
    }
    this.refusals += 1;
    reporter.waiting("Instagram asked us to slow down", wait);
    await this.sleeper.sleep(wait, signal);
  }
}
