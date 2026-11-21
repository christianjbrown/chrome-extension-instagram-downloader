import type { Scheduler } from "../scheduler";
import { SECOND_MS } from "../time";

export interface Countdown {
  /** Calls show with the time left now and as each second passes, down to zero. The returned function stops it. */
  start(ms: number, show: (remainingMs: number) => void): () => void;
}

// Ticks on the second boundaries of the time left, so a display that rounds
// up to whole seconds changes on every tick and never skips one.
export class SecondCountdown implements Countdown {
  constructor(
    private readonly scheduler: Scheduler,
    private readonly now: () => number,
  ) {}

  start(ms: number, show: (remainingMs: number) => void): () => void {
    const end = this.now() + ms;
    let cancel: (() => void) | undefined;
    const tick = (): void => {
      const remaining = Math.max(0, end - this.now());
      show(remaining);
      if (remaining === 0) return;
      cancel = this.scheduler.after(remaining % SECOND_MS || SECOND_MS, tick);
    };
    tick();
    return () => {
      cancel?.();
    };
  }
}
