// How hard bulk downloads lean on Instagram. Slower is safer.
import { MINUTE_MS, SECOND_MS, SECONDS_PER_MINUTE } from "../time";

export interface Pacing {
  /** Random wait before every Instagram API call, which sets the pace. */
  readonly apiDelayMs: readonly [number, number];
  /** Ceiling on API calls in any rolling hour: a backstop behind the backoff, not the pace. */
  readonly apiCallsPerHour: number;
  /** Random wait between files, which come from the CDN, not the API. */
  readonly fileDelayMs: readonly [number, number];
  /** Waits after a refused request, in order; refused again after the last and the run stops. */
  readonly backoffMs: readonly number[];
}

export interface WaitReporter {
  waiting(reason: string, ms: number): void;
}

// Past this, a wait is shown in whole minutes.
const minutesOnlyFromMs = 10 * MINUTE_MS;

const count = (n: number, unit: string): string =>
  `${String(n)} ${unit}${n === 1 ? "" : "s"}`;

// Seconds count for the short waits, where "2 minutes" would overstate a
// 61 second wait; past ten minutes they are only noise.
function duration(ms: number): string {
  const seconds = Math.ceil(ms / SECOND_MS);
  if (seconds < SECONDS_PER_MINUTE) return count(seconds, "second");
  if (ms >= minutesOnlyFromMs)
    return count(Math.ceil(ms / MINUTE_MS), "minute");
  const minutes = count(Math.floor(seconds / SECONDS_PER_MINUTE), "minute");
  const remainder = seconds % SECONDS_PER_MINUTE;
  return remainder === 0 ? minutes : `${minutes} ${count(remainder, "second")}`;
}

export function describeWait(reason: string, ms: number): string {
  return `${reason}. Waiting ${duration(ms)}.`;
}
