import { downloadItems } from "../../shared/media";
import type { PostsPage } from "../../shared/bridge";
import type { Bridge } from "../bridgeClient";
import type { Pacer } from "../pacing/pacer";
import type { ItemWriter, WriteOutcome } from "../saving/directoryWriter";
import type { RunReporter } from "../ui/progressPanel";

export type Counts = Record<WriteOutcome, number>;

interface Tally {
  readonly counts: Counts;
  post: number;
}

export function describeCounts(counts: Counts): string {
  const failed = counts.failed > 0 ? `, ${String(counts.failed)} failed` : "";
  return `${String(counts.saved)} saved, ${String(counts.skipped)} already there${failed}`;
}

// Where the run has got to. Posts are counted against the account's total
// when the page knows it; the counts after the colon are files, since a
// carousel post holds several.
export function describeProgress(
  post: number,
  total: number | undefined,
  counts: Counts,
): string {
  const of = total !== undefined && post <= total ? ` of ${String(total)}` : "";
  return `Post ${String(post)}${of}: ${describeCounts(counts)}`;
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
  ) {}

  async archive(request: ArchiveRequest): Promise<Counts> {
    const { username, signal, reporter } = request;
    const folder = await request.folder.getDirectoryHandle(username, {
      create: true,
    });
    const tally = { counts: { saved: 0, skipped: 0, failed: 0 }, post: 0 };
    let cursor: string | undefined;
    let page = 0;
    do {
      const result = await this.pacer.gate.call(
        () => this.bridge.call("postsPage", { username, cursor }),
        signal,
        reporter,
      );
      page += 1;
      const saved = tally.counts.saved;
      await this.writePage(folder, result, tally, request);
      // Page one can be all pinned posts, so only trust a later page.
      if (request.onlyNew && page > 1 && tally.counts.saved === saved) break;
      cursor = result.cursor;
    } while (cursor !== undefined);
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
      for (const item of downloadItems(media, username)) {
        await this.writeOne(folder, item, tally.counts, signal);
        reporter.detail(
          describeProgress(tally.post, result.total, tally.counts),
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
