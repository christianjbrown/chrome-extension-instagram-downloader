// Counts one account's posts and files as they are saved, and how far
// through the account that is.
import { ALL_DONE } from "../ui/percent";
import type { WriteOutcome } from "../saving/ports";
import { noCounts, type Counts } from "./counts";
import type { AccountCounter, AccountPosition } from "./ports";

export class AccountCounts implements AccountCounter {
  private readonly counts = noCounts();
  private post = 0;
  private known: number | undefined;

  total(total: number | undefined): void {
    this.known = total;
  }

  unreadable(count: number | undefined): void {
    const posts = count ?? 0;
    this.counts.failed += posts;
    this.post += posts;
  }

  nextPost(): void {
    this.post += 1;
  }

  file(outcome: WriteOutcome): void {
    this.counts[outcome] += 1;
  }

  saved(): number {
    return this.counts.saved;
  }

  tally(): Counts {
    return this.counts;
  }

  position(): AccountPosition {
    return { post: this.post, total: this.known, counts: this.counts };
  }

  fraction(): number | undefined {
    return this.known === undefined
      ? undefined
      : Math.min(ALL_DONE, this.post / this.known);
  }

  // Instagram's count can include posts it never sends, so a finished
  // account fills its bar rather than stopping short of the end.
  finishedFraction(): number | undefined {
    return this.known === undefined ? undefined : ALL_DONE;
  }
}
