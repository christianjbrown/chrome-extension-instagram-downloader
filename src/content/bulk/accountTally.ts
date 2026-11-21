import { ALL_DONE } from "../ui/percent";
import type { AccountProgress, DetailReporter } from "../ui/ports";
import type { WriteOutcome } from "../saving/ports";
import { noCounts, type Counts } from "./counts";
import type { AccountTally, ProgressWording, TallyStarter } from "./ports";

// Counts one account's posts and files, and shows them on the panel as words
// and as the account's bar.
class BarTally implements AccountTally {
  private readonly counts = noCounts();
  private post = 0;
  private known: number | undefined;

  constructor(
    private readonly reporter: DetailReporter & AccountProgress,
    private readonly wording: ProgressWording,
  ) {}

  begin(): void {
    this.reporter.accountBar(undefined);
  }

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
    this.showBar(this.known);
  }

  file(outcome: WriteOutcome): void {
    this.counts[outcome] += 1;
    this.reporter.detail(
      this.wording.progress(this.post, this.known, this.counts),
    );
  }

  saved(): number {
    return this.counts.saved;
  }

  // Instagram's count can include posts it never sends, so a finished
  // account fills its bar rather than stopping short of the end.
  finish(): Counts {
    this.fill(this.known);
    return this.counts;
  }

  private showBar(total: number | undefined): void {
    if (total !== undefined)
      this.reporter.accountBar(Math.min(ALL_DONE, this.post / total));
  }

  private fill(total: number | undefined): void {
    if (total !== undefined) this.reporter.accountBar(ALL_DONE);
  }
}

/** Starts a bar tally for each account. */
export class BarTallies implements TallyStarter {
  constructor(private readonly wording: ProgressWording) {}

  start(reporter: DetailReporter & AccountProgress): AccountTally {
    return new BarTally(reporter, this.wording);
  }
}
