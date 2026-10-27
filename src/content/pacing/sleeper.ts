import { abortError } from "../errors";

export interface Sleeper {
  sleep(ms: number, signal: AbortSignal): Promise<void>;
  between(range: readonly [number, number], signal: AbortSignal): Promise<void>;
}

// Waits that end early, with an AbortError, when the run is stopped.
export class TimerSleeper implements Sleeper {
  constructor(private readonly random: () => number = Math.random) {}

  sleep(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(abortError());
        return;
      }
      const onAbort = (): void => {
        clearTimeout(timer);
        reject(abortError());
      };
      const timer = setTimeout(() => {
        signal.removeEventListener("abort", onAbort);
        resolve();
      }, ms);
      signal.addEventListener("abort", onAbort, { once: true });
    });
  }

  between(
    [min, max]: readonly [number, number],
    signal: AbortSignal,
  ): Promise<void> {
    return this.sleep(min + this.random() * (max - min), signal);
  }
}
