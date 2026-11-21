import { EVENTS } from "../../shared/dom";
import { abortError } from "../errors";
import type { Scheduler } from "../ports";
import type { RandomWait, Sleeper } from "./ports";

// Waits that end early, with an AbortError, when the run is stopped.
export class TimerSleeper implements Sleeper, RandomWait {
  constructor(
    private readonly scheduler: Scheduler,
    private readonly random: () => number,
  ) {}

  sleep(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(abortError());
        return;
      }
      const onAbort = (): void => {
        cancel();
        reject(abortError());
      };
      const cancel = this.scheduler.after(ms, () => {
        signal.removeEventListener(EVENTS.abort, onAbort);
        resolve();
      });
      signal.addEventListener(EVENTS.abort, onAbort, { once: true });
    });
  }

  between(
    [min, max]: readonly [number, number],
    signal: AbortSignal,
  ): Promise<void> {
    return this.sleep(min + this.random() * (max - min), signal);
  }
}
