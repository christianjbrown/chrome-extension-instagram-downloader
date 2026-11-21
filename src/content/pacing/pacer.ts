import type { Gate, Sleeper } from "./ports";

/** Everything an account archive needs to keep its pace. */
export interface Pacer {
  readonly gate: Gate;
  readonly sleeper: Sleeper;
  /** Random wait between files, which come from the CDN, not the API. */
  readonly fileDelayMs: readonly [number, number];
}
