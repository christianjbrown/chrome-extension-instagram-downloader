// The words the progress panel shows while a bulk download runs.
import { FULL_PERCENT, percentText } from "../ui/percent";
import type { Counts } from "./counts";

const plural = (n: number, one: string, many: string): string =>
  `${String(n)} ${n === 1 ? one : many}`;

/** Whole percent done, never rounded up to a hundred before the end. */
export const percent = (done: number, total: number): number =>
  Math.floor((Math.min(done, total) / total) * FULL_PERCENT);

// Counts files rather than posts, since a carousel post holds several.
export function describeCounts(counts: Counts): string {
  const failed = counts.failed > 0 ? `, ${String(counts.failed)} failed` : "";
  const fresh = plural(counts.saved, "new file", "new files");
  const existing = plural(counts.skipped, "already exists", "already exist");
  return `${fresh}, ${existing}${failed}`;
}

// The account's total is left out when it is unknown, or when Instagram's
// count has fallen behind the posts it actually sent.
const isAhead = (post: number, total: number | undefined): total is number =>
  total !== undefined && post <= total;

export function describeProgress(
  post: number,
  total: number | undefined,
  counts: Counts,
): string {
  const of = isAhead(post, total)
    ? ` of ${String(total)} (${percentText(percent(post, total))})`
    : "";
  return `Post ${String(post)}${of}: ${describeCounts(counts)}`;
}

export function describeFollowingFinished(total: number): string {
  return `Finished all ${String(total)} accounts you follow.`;
}

export function describeFailureStop(
  inARow: number,
  username: string,
  reason: string,
): string {
  return `Stopped after ${String(inARow)} accounts in a row failed. The last, ${username}, failed with: ${reason}`;
}

// Starts with a space, since it follows the sentence that ends a run.
export function describeUnreadable(usernames: readonly string[]): string {
  return usernames.length === 0
    ? ""
    : ` Could not read ${String(usernames.length)}: ${usernames.join(", ")}.`;
}

const accountLine = (position: number, total: number, done: number): string =>
  `Account ${String(position)} of ${String(total)} (${percentText(percent(done, total))})`;

/** The account being worked on, counting only those before it as done. */
export const describeAccount = (position: number, total: number): string =>
  accountLine(position, total, position - 1);

/** The same line once the last account has finished too. */
export const describeAccountsFinished = (total: number): string =>
  accountLine(total, total, total);
