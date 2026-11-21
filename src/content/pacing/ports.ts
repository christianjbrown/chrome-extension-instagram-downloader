// The parts that keep bulk downloads at a pace Instagram accepts.
import type { WaitReporter } from "./pacing";

export interface Gate {
  call<T>(
    request: () => Promise<T>,
    signal: AbortSignal,
    reporter: WaitReporter,
  ): Promise<T>;
}

/** Waits, when it has to, until another API call fits in the budget. */
export interface Budget {
  take(signal: AbortSignal, onWait: (ms: number) => void): Promise<void>;
}

/** Waits a set time, ending early when the run is stopped. */
export interface Sleeper {
  sleep(ms: number, signal: AbortSignal): Promise<void>;
}

/** Waits a random time inside a range, ending early when the run is stopped. */
export interface RandomWait {
  between(range: readonly [number, number], signal: AbortSignal): Promise<void>;
}

/** How long to wait after each refusal in a row. */
export interface RefusalBackoff {
  /**
   * The wait after one more refusal, or undefined once every wait is spent,
   * which also starts the count again.
   */
  next(): number | undefined;
  /** A request went through, so the count starts again. */
  reset(): void;
}
