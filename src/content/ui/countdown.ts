import type { Scheduler } from "../ports";
import type { Countdown } from "./ports";
import { SECOND_MS } from "../time";

// On a whole second, the next tick is a full second away.
const untilNextSecond = (remaining: number): number =>
  remaining % SECOND_MS || SECOND_MS;

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
      if (remaining !== 0)
        cancel = this.scheduler.after(untilNextSecond(remaining), tick);
    };
    tick();
    return () => {
      cancel?.();
    };
  }
}
