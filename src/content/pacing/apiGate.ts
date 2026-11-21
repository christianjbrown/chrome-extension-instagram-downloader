import { RefusedError } from "../../shared/refusal";
import { BlockedError } from "../errors";
import type {
  Budget,
  Gate,
  RandomWait,
  RefusalBackoff,
  Sleeper,
} from "./ports";
import type { Pacing, WaitReporter } from "./pacing";

// The parts of the pacing the gate itself applies.
type GatePacing = Pick<Pacing, "apiDelayMs">;

const text = {
  hourlyLimit: "Hourly request limit reached",
  slowDown: "Instagram asked us to slow down",
  blocked:
    "Instagram kept refusing requests, so the run stopped. Try again tomorrow.",
} as const;

// Every bulk API call goes through here: the hourly budget, a random delay,
// and the backoff's wait when Instagram refuses. Any other failure is passed
// straight on, with its own message, rather than waited out.
export class ApiGate implements Gate {
  constructor(
    private readonly sleeper: Sleeper & RandomWait,
    private readonly budget: Budget,
    private readonly pacing: GatePacing,
    private readonly backoff: RefusalBackoff,
  ) {}

  async call<T>(
    request: () => Promise<T>,
    signal: AbortSignal,
    reporter: WaitReporter,
  ): Promise<T> {
    await this.budget.take(signal, (ms) => {
      reporter.waiting(text.hourlyLimit, ms);
    });
    await this.sleeper.between(this.pacing.apiDelayMs, signal);
    return this.attempt(request, signal, reporter);
  }

  private async attempt<T>(
    request: () => Promise<T>,
    signal: AbortSignal,
    reporter: WaitReporter,
  ): Promise<T> {
    try {
      const result = await request();
      this.backoff.reset();
      return result;
    } catch (error) {
      return this.retry(error, request, signal, reporter);
    }
  }

  // Only a refusal is waited out and tried again; anything else is thrown.
  private async retry<T>(
    error: unknown,
    request: () => Promise<T>,
    signal: AbortSignal,
    reporter: WaitReporter,
  ): Promise<T> {
    if (!(error instanceof RefusedError)) throw error;
    await this.backOff(signal, reporter);
    return this.call(request, signal, reporter);
  }

  private async backOff(
    signal: AbortSignal,
    reporter: WaitReporter,
  ): Promise<void> {
    const wait = this.backoff.next();
    if (wait === undefined) throw new BlockedError(text.blocked);
    reporter.waiting(text.slowDown, wait);
    await this.sleeper.sleep(wait, signal);
  }
}
