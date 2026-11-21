import type { DownloadItem } from "../../shared/media";
import type { RandomWait } from "../pacing/ports";
import type { ItemWriter, WriteOutcome } from "../saving/ports";
import type { ItemSaver } from "./ports";

const skipped: WriteOutcome = "skipped";

// Skips a file already in the folder, and waits a random time before each
// one it writes, since files come from the CDN rather than the API.
export class PacedItemSaver implements ItemSaver {
  constructor(
    private readonly writer: ItemWriter,
    private readonly sleeper: RandomWait,
    private readonly fileDelayMs: readonly [number, number],
  ) {}

  async save(
    folder: FileSystemDirectoryHandle,
    item: DownloadItem,
    signal: AbortSignal,
  ): Promise<WriteOutcome> {
    signal.throwIfAborted();
    if (await this.writer.exists(folder, item)) return skipped;
    await this.sleeper.between(this.fileDelayMs, signal);
    return this.writer.write(folder, item);
  }
}
