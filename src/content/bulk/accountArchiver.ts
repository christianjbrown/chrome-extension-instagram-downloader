import { downloadItems } from "../../shared/media";
import type { PostsPage } from "../../shared/bridge";
import type { Bridge } from "../bridgeClient";
import type { Pacer } from "../pacing/pacer";
import type { ItemWriter } from "../saving/directoryWriter";
import type { RunReporter } from "../ui/progressPanel";
import type { PostTotals } from "./postTotals";
import { describeProgress, type Counts } from "./progressText";

interface Tally {
  readonly counts: Counts;
  post: number;
  total: number | undefined;
}

export interface ArchiveRequest {
  readonly username: string;
  readonly folder: FileSystemDirectoryHandle;
  /** The account was archived in full before, so stop at posts already saved. */
  readonly onlyNew: boolean;
  readonly signal: AbortSignal;
  readonly reporter: RunReporter;
}

// Writes every post of one account into folder/<username>/, skipping files
// already there.
export class AccountArchiver {
  constructor(
    private readonly bridge: Bridge,
    private readonly writer: ItemWriter,
    private readonly pacer: Pacer,
    private readonly totals: PostTotals,
  ) {}

  async archive(request: ArchiveRequest): Promise<Counts> {
    const { username, signal, reporter } = request;
    const folder = await request.folder.getDirectoryHandle(username, {
      create: true,
    });
    const tally: Tally = {
      counts: { saved: 0, skipped: 0, failed: 0 },
      post: 0,
      total: undefined,
    };
    reporter.accountBar(undefined);
    let cursor: string | undefined;
    let page = 0;
    do {
      const result = await this.pacer.gate.call(
        () => this.bridge.call("postsPage", { username, cursor }),
        signal,
        reporter,
      );
      page += 1;
      // A rerun stops at the first old page, so a total would only mislead.
      if (page === 1 && !request.onlyNew)
        tally.total = await this.totals.find(
          username,
          result,
          signal,
          reporter,
        );
      const saved = tally.counts.saved;
      await this.writePage(folder, result, tally, request);
      // Page one can be all pinned posts, so only trust a later page.
      if (request.onlyNew && page > 1 && tally.counts.saved === saved) break;
      cursor = result.cursor;
    } while (cursor !== undefined);
    // Instagram's count can include posts it never sends, so a finished
    // account fills its bar rather than stopping short of the end.
    if (tally.total !== undefined) reporter.accountBar(1);
    return tally.counts;
  }

  private async writePage(
    folder: FileSystemDirectoryHandle,
    result: PostsPage,
    tally: Tally,
    { username, signal, reporter }: ArchiveRequest,
  ): Promise<void> {
    const unreadable = result.unreadable ?? 0;
    tally.counts.failed += unreadable;
    tally.post += unreadable;
    for (const media of result.items) {
      tally.post += 1;
      if (tally.total !== undefined)
        reporter.accountBar(Math.min(1, tally.post / tally.total));
      for (const item of downloadItems(media, username)) {
        await this.writeOne(folder, item, tally.counts, signal);
        reporter.detail(
          describeProgress(tally.post, tally.total, tally.counts),
        );
      }
    }
  }

  private async writeOne(
    folder: FileSystemDirectoryHandle,
    item: Parameters<ItemWriter["write"]>[1],
    counts: Counts,
    signal: AbortSignal,
  ): Promise<void> {
    signal.throwIfAborted();
    if (await this.writer.exists(folder, item)) {
      counts.skipped += 1;
      return;
    }
    await this.pacer.sleeper.between(this.pacer.pacing.fileDelayMs, signal);
    counts[await this.writer.write(folder, item)] += 1;
  }
}
