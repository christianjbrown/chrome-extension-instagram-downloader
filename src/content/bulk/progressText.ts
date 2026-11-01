// The words the progress panel shows while a bulk download runs.
import type { WriteOutcome } from "../saving/directoryWriter";

export type Counts = Record<WriteOutcome, number>;

const plural = (n: number, one: string, many: string): string =>
  `${String(n)} ${n === 1 ? one : many}`;

/** Whole percent done, never rounded up to a hundred before the end. */
export const percent = (done: number, total: number): number =>
  Math.floor((Math.min(done, total) / total) * 100);

// Counts files rather than posts, since a carousel post holds several.
export function describeCounts(counts: Counts): string {
  const failed = counts.failed > 0 ? `, ${String(counts.failed)} failed` : "";
  const fresh = plural(counts.saved, "new file", "new files");
  const existing = plural(counts.skipped, "already exists", "already exist");
  return `${fresh}, ${existing}${failed}`;
}

// The account's total is left out when it is unknown, or when Instagram's
// count has fallen behind the posts it actually sent.
export function describeProgress(
  post: number,
  total: number | undefined,
  counts: Counts,
): string {
  const of =
    total !== undefined && post <= total
      ? ` of ${String(total)} (${String(percent(post, total))}%)`
      : "";
  return `Post ${String(post)}${of}: ${describeCounts(counts)}`;
}

export function describeAccount(position: number, total: number): string {
  return `Account ${String(position)} of ${String(total)} (${String(percent(position - 1, total))}%)`;
}
