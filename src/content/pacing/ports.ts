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

export interface Sleeper {
  sleep(ms: number, signal: AbortSignal): Promise<void>;
  between(range: readonly [number, number], signal: AbortSignal): Promise<void>;
}
