import { HOUR_MS } from "../time";
import type { Sleeper, Budget } from "./ports";

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
    const oldest = this.oldestWhenFull();
    if (oldest === undefined) this.calls.push(this.now());
    else await this.waitFor(oldest, signal, onWait);
  }

  // The call that has to age out of the hour before another fits.
  private oldestWhenFull(): number | undefined {
    const [oldest] = this.calls;
    return this.calls.length >= this.limit ? oldest : undefined;
  }

  private async waitFor(
    oldest: number,
    signal: AbortSignal,
    onWait: (ms: number) => void,
  ): Promise<void> {
    const wait = oldest + HOUR_MS - this.now();
    onWait(wait);
    await this.sleeper.sleep(wait, signal);
    await this.take(signal, onWait);
  }
}
