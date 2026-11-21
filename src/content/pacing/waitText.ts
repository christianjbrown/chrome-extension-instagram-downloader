// How the progress panel words a wait.
import { MINUTE_MS, SECOND_MS, SECONDS_PER_MINUTE } from "../time";

// Past this, a wait is shown in whole minutes.
const minutesOnlyFromMs = 10 * MINUTE_MS;

const units = { second: "second", minute: "minute" } as const;
const pluralSuffix = "s";

const count = (n: number, unit: string): string =>
  `${String(n)} ${unit}${n === 1 ? "" : pluralSuffix}`;

// Seconds count for the short waits, where "2 minutes" would overstate a
// 61 second wait; past ten minutes they are only noise.
function duration(ms: number): string {
  const seconds = Math.ceil(ms / SECOND_MS);
  return seconds < SECONDS_PER_MINUTE
    ? count(seconds, units.second)
    : longWait(ms, seconds);
}

function longWait(ms: number, seconds: number): string {
  return ms >= minutesOnlyFromMs
    ? count(Math.ceil(ms / MINUTE_MS), units.minute)
    : minutesAndSeconds(seconds);
}

function minutesAndSeconds(seconds: number): string {
  const minutes = count(Math.floor(seconds / SECONDS_PER_MINUTE), units.minute);
  const remainder = seconds % SECONDS_PER_MINUTE;
  return remainder === 0
    ? minutes
    : `${minutes} ${count(remainder, units.second)}`;
}

export function describeWait(reason: string, ms: number): string {
  return `${reason}. Waiting ${duration(ms)}.`;
}
