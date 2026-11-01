// How hard bulk downloads lean on Instagram. Slower is safer.
export interface Pacing {
  /** Random wait before every Instagram API call. */
  readonly apiDelayMs: readonly [number, number];
  /** How many API calls between longer rests, wherever the account boundaries fall. */
  readonly restEveryCalls: number;
  /** Random length of that rest. */
  readonly restDelayMs: readonly [number, number];
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

const second = 1000;
const minute = 60 * second;

export const defaultPacing: Pacing = {
  apiDelayMs: [4000, 9000],
  restEveryCalls: 30,
  restDelayMs: [60_000, 120_000],
  apiCallsPerHour: 400,
  fileDelayMs: [400, 1200],
  backoffMs: [15 * minute, 30 * minute, 60 * minute, 120 * minute],
};

const count = (n: number, unit: string): string =>
  `${String(n)} ${unit}${n === 1 ? "" : "s"}`;

// Seconds count for the short waits, where "2 minutes" would overstate a
// 61 second rest; past ten minutes they are only noise.
function duration(ms: number): string {
  const seconds = Math.ceil(ms / second);
  if (seconds < 60) return count(seconds, "second");
  if (ms >= 10 * minute) return count(Math.ceil(ms / minute), "minute");
  const minutes = count(Math.floor(seconds / 60), "minute");
  const remainder = seconds % 60;
  return remainder === 0 ? minutes : `${minutes} ${count(remainder, "second")}`;
}

export function describeWait(reason: string, ms: number): string {
  return `${reason}. Waiting ${duration(ms)}.`;
}
