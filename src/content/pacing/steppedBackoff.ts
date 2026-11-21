import type { RefusalBackoff } from "./ports";

// Waits longer after each refusal in a row, through a fixed list of waits.
export class SteppedBackoff implements RefusalBackoff {
  private refusals = 0;

  constructor(private readonly waitsMs: readonly number[]) {}

  next(): number | undefined {
    const wait = this.waitsMs[this.refusals];
    if (wait === undefined) this.reset();
    else this.refusals += 1;
    return wait;
  }

  reset(): void {
    this.refusals = 0;
  }
}
