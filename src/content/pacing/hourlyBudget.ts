import type { Sleeper } from "./sleeper";

const hour = 3_600_000;

// Keeps API calls under a ceiling in any rolling hour, waiting when it is hit.
export class HourlyBudget {
  private calls: number[] = [];

  constructor(
    private readonly limit: number,
    private readonly sleeper: Sleeper,
    private readonly now: () => number,
  ) {}

  async take(signal: AbortSignal, onWait: (ms: number) => void): Promise<void> {
    this.calls = this.calls.filter((time) => this.now() - time < hour);
    const [oldest] = this.calls;
    if (oldest !== undefined && this.calls.length >= this.limit) {
      const wait = oldest + hour - this.now();
      onWait(wait);
      await this.sleeper.sleep(wait, signal);
      await this.take(signal, onWait);
      return;
    }
    this.calls.push(this.now());
  }
}
