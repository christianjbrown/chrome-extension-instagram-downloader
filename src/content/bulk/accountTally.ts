import type { AccountProgress, DetailReporter } from "../ui/ports";
import type { WriteOutcome } from "../saving/ports";
import type { Counts } from "./counts";
import type {
  AccountCounter,
  AccountTally,
  CounterClass,
  ProgressWording,
  TallyStarter,
} from "./ports";

// Shows one account's counts on the panel, as words and as the account's
// bar. The counting is the counter's.
class BarTally implements AccountTally {
  constructor(
    private readonly reporter: DetailReporter & AccountProgress,
    private readonly wording: ProgressWording,
    private readonly counter: AccountCounter,
  ) {}

  begin(): void {
    this.reporter.accountBar(undefined);
  }

  total(total: number | undefined): void {
    this.counter.total(total);
  }

  unreadable(count: number | undefined): void {
    this.counter.unreadable(count);
  }

  nextPost(): void {
    this.counter.nextPost();
    this.showBar(this.counter.fraction());
  }

  file(outcome: WriteOutcome): void {
    this.counter.file(outcome);
    const { post, total, counts } = this.counter.position();
    this.reporter.detail(this.wording.progress(post, total, counts));
  }

  saved(): number {
    return this.counter.saved();
  }

  finish(): Counts {
    this.showBar(this.counter.finishedFraction());
    return this.counter.tally();
  }

  // The bar stays as it is while the account's total is unknown.
  private showBar(fraction: number | undefined): void {
    if (fraction !== undefined) this.reporter.accountBar(fraction);
  }
}

/** Starts a bar tally, with its own counts, for each account. */
export class BarTallies implements TallyStarter {
  constructor(
    private readonly wording: ProgressWording,
    private readonly counterClass: CounterClass,
  ) {}

  start(reporter: DetailReporter & AccountProgress): AccountTally {
    return new BarTally(reporter, this.wording, new this.counterClass());
  }
}
