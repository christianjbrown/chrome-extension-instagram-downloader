// How hard bulk downloads lean on Instagram. Slower is safer.
export interface Pacing {
  /** Random wait before every Instagram API call. */
  readonly apiDelayMs: readonly [number, number];
  /** Hard ceiling on API calls in any rolling hour. */
  readonly apiCallsPerHour: number;
  /** Random rest between one account and the next. */
  readonly accountDelayMs: readonly [number, number];
  /** Random wait between files, which come from the CDN, not the API. */
  readonly fileDelayMs: readonly [number, number];
  /** Waits after a refused request, in order; refused again after the last and the run stops. */
  readonly backoffMs: readonly number[];
}

const minute = 60_000;

export const defaultPacing: Pacing = {
  apiDelayMs: [4000, 9000],
  apiCallsPerHour: 120,
  accountDelayMs: [30_000, 90_000],
  fileDelayMs: [400, 1200],
  backoffMs: [15 * minute, 30 * minute, 60 * minute, 120 * minute],
};

export function describeWait(reason: string, ms: number): string {
  const minutes = Math.ceil(ms / minute);
  return `${reason}. Waiting ${String(minutes)} minute${minutes === 1 ? "" : "s"}.`;
}
