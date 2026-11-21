import { downloadItems } from "../../shared/media";
import type { PostsPage } from "../../shared/bridge";
import type { Bridge } from "../bridgeClient";
import type { Pacer } from "../pacing/pacer";
import type { ItemWriter } from "../saving/directoryWriter";
import { ALL_DONE } from "../ui/percent";
import type { RunReporter } from "../ui/progressPanel";
import type { CatchUpPolicy } from "./catchUp";
import type { PostTotals } from "./postTotals";
import { describeProgress, noCounts, type Counts } from "./progressText";

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

export interface ArchiverDependencies {
  readonly bridge: Bridge;
  readonly writer: ItemWriter;
  readonly pacer: Pacer;
  readonly totals: PostTotals;
  readonly catchUp: CatchUpPolicy;
}

export interface Archiver {
  archive(request: ArchiveRequest): Promise<Counts>;
}

// Writes every post of one account into folder/<username>/, skipping files
// already there.
export class AccountArchiver implements Archiver {
  constructor(private readonly deps: ArchiverDependencies) {}

  async archive(request: ArchiveRequest): Promise<Counts> {
    const { username, onlyNew, signal, reporter } = request;
    const folder = await request.folder.getDirectoryHandle(username, {
      create: true,
    });
    const tally: Tally = { counts: noCounts(), post: 0, total: undefined };
    reporter.accountBar(undefined);
    let cursor: string | undefined;
    let page = 0;
    do {
      const result = await this.postsPage(request, cursor);
      page += 1;
      if (this.deps.catchUp.wantsTotal(page, onlyNew))
        tally.total = await this.deps.totals.find(
          username,
          result,
          signal,
          reporter,
        );
      const saved = tally.counts.saved;
      await this.writePage(folder, result, tally, request);
      const newFiles = tally.counts.saved - saved;
      if (this.deps.catchUp.caughtUp(page, onlyNew, newFiles)) break;
      cursor = result.cursor;
    } while (cursor !== undefined);
    // Instagram's count can include posts it never sends, so a finished
    // account fills its bar rather than stopping short of the end.
    if (tally.total !== undefined) reporter.accountBar(ALL_DONE);
    return tally.counts;
  }

  private postsPage(
    { username, signal, reporter }: ArchiveRequest,
    cursor: string | undefined,
  ): Promise<PostsPage> {
    return this.deps.pacer.gate.call(
      () => this.deps.bridge.call("postsPage", { username, cursor }),
      signal,
      reporter,
    );
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
        reporter.accountBar(Math.min(ALL_DONE, tally.post / tally.total));
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
    const { writer, pacer } = this.deps;
    if (await writer.exists(folder, item)) {
      counts.skipped += 1;
      return;
    }
    await pacer.sleeper.between(pacer.fileDelayMs, signal);
    counts[await writer.write(folder, item)] += 1;
  }
}
