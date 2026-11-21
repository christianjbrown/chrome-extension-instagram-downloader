// How hard bulk downloads lean on Instagram. Slower is safer.
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
