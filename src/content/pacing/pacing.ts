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

export function describeWait(reason: string, ms: number): string {
  if (ms < minute) {
    const seconds = Math.ceil(ms / second);
    return `${reason}. Waiting ${String(seconds)} second${seconds === 1 ? "" : "s"}.`;
  }
  const minutes = Math.ceil(ms / minute);
  return `${reason}. Waiting ${String(minutes)} minute${minutes === 1 ? "" : "s"}.`;
}
