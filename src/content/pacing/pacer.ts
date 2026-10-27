import type { Gate } from "./apiGate";
import type { Pacing } from "./pacing";
import type { Sleeper } from "./sleeper";

/** Everything a bulk download needs to keep its pace. */
export interface Pacer {
  readonly gate: Gate;
  readonly sleeper: Sleeper;
  readonly pacing: Pacing;
}
