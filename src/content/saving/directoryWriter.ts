import type { DownloadItem } from "../../shared/media";
import {
  OUTCOME,
  type FetchBlob,
  type FileNamer,
  type WriteOutcome,
  type ItemWriter,
} from "./ports";

// What the File System Access API throws for a file that is not there.
const notFoundErrorName = "NotFoundError";

const isNotFound = (error: unknown): boolean =>
  error instanceof DOMException && error.name === notFoundErrorName;

// A file that is not there is a plain no; asking must not create it.
function absent(error: unknown): false {
  if (isNotFound(error)) return false;
  throw error;
}

// Writes files into a folder the user chose. A file that fails is not
// kept, so the next run tries it again.
export class DirectoryWriter implements ItemWriter {
  constructor(
    private readonly fetchBlob: FetchBlob,
    private readonly namer: FileNamer,
  ) {}

  async exists(
    folder: FileSystemDirectoryHandle,
    item: DownloadItem,
  ): Promise<boolean> {
    try {
      return await this.hasContent(folder, item);
    } catch (error) {
      return absent(error);
    }
  }

  private async hasContent(
    folder: FileSystemDirectoryHandle,
    item: DownloadItem,
  ): Promise<boolean> {
    const handle = await folder.getFileHandle(this.namer.nameFor(item));
    return (await handle.getFile()).size > 0;
  }

  async write(
    folder: FileSystemDirectoryHandle,
    item: DownloadItem,
  ): Promise<WriteOutcome> {
    return (await this.exists(folder, item))
      ? OUTCOME.skipped
      : this.save(folder, item);
  }

  private async save(
    folder: FileSystemDirectoryHandle,
    item: DownloadItem,
  ): Promise<WriteOutcome> {
    try {
      const blob = await this.fetchBlob(item.url);
      const handle = await folder.getFileHandle(this.namer.nameFor(item), {
        create: true,
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return OUTCOME.saved;
    } catch {
      return OUTCOME.failed;
    }
  }
}
