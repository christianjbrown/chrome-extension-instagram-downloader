import { HOUR_MS } from "../time";
import type { Sleeper } from "./sleeper";

/** Waits, when it has to, until another API call fits in the budget. */
export interface Budget {
  take(signal: AbortSignal, onWait: (ms: number) => void): Promise<void>;
}

// Keeps API calls under a ceiling in any rolling hour, waiting when it is hit.
export class HourlyBudget implements Budget {
  private calls: number[] = [];

  constructor(
    private readonly limit: number,
    private readonly sleeper: Sleeper,
    private readonly now: () => number,
  ) {}

  async take(signal: AbortSignal, onWait: (ms: number) => void): Promise<void> {
    this.calls = this.calls.filter((time) => this.now() - time < HOUR_MS);
    const [oldest] = this.calls;
    if (oldest !== undefined && this.calls.length >= this.limit) {
      const wait = oldest + HOUR_MS - this.now();
      onWait(wait);
      await this.sleeper.sleep(wait, signal);
      await this.take(signal, onWait);
      return;
    }
    this.calls.push(this.now());
  }
}
