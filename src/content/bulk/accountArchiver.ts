import { downloadItems } from "../../shared/media";
import type { Bridge } from "../bridgeClient";
import type { Pacer } from "../pacing/pacer";
import type { ItemWriter, WriteOutcome } from "../saving/directoryWriter";
import type { RunReporter } from "../ui/progressPanel";

export type Counts = Record<WriteOutcome, number>;

export function describeCounts(counts: Counts): string {
  const failed = counts.failed > 0 ? `, ${String(counts.failed)} failed` : "";
  return `${String(counts.saved)} saved, ${String(counts.skipped)} already there${failed}`;
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
    const counts: Counts = { saved: 0, skipped: 0, failed: 0 };
    let cursor: string | undefined;
    let page = 0;
    do {
      const result = await this.pacer.gate.call(
        () => this.bridge.call("postsPage", { username, cursor }),
        signal,
        reporter,
      );
      page += 1;
      counts.failed += result.unreadable ?? 0;
      const saved = counts.saved;
      for (const media of result.items) {
        for (const item of downloadItems(media, username)) {
          await this.writeOne(folder, item, counts, signal);
          reporter.detail(describeCounts(counts));
        }
      }
      // Page one can be all pinned posts, so only trust a later page.
      if (request.onlyNew && page > 1 && counts.saved === saved) break;
      cursor = result.cursor;
    } while (cursor !== undefined);
    return counts;
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
