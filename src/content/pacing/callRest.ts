import type { Pacing, WaitReporter } from "./pacing";
import type { Sleeper } from "./sleeper";

export interface Rest {
  /** Called once before every API call; rests when enough have gone before. */
  before(signal: AbortSignal, reporter: WaitReporter): Promise<void>;
}

// A longer pause every so many API calls, wherever the account boundaries
// fall. An account with three posts costs one call rather than a rest of its
// own, and an account with thousands still gets its breathers.
export class RestEveryCalls implements Rest {
  private calls = 0;

  constructor(
    private readonly pacing: Pick<Pacing, "restEveryCalls" | "restDelayMs">,
    private readonly sleeper: Sleeper,
    private readonly random: () => number = Math.random,
  ) {}

  async before(signal: AbortSignal, reporter: WaitReporter): Promise<void> {
    const { restEveryCalls, restDelayMs } = this.pacing;
    if (this.calls > 0 && this.calls % restEveryCalls === 0) {
      const [min, max] = restDelayMs;
      const ms = Math.round(min + this.random() * (max - min));
      reporter.waiting(`Resting after ${String(restEveryCalls)} requests`, ms);
      await this.sleeper.sleep(ms, signal);
    }
    this.calls += 1;
  }
}
