import type { DownloadItem } from "../../shared/media";
import type { FetchBlob } from "./fetchBlob";
import type { FileNamer } from "./fileNamer";

export const WRITE_OUTCOMES = ["saved", "skipped", "failed"] as const;
export type WriteOutcome = (typeof WRITE_OUTCOMES)[number];

// What the File System Access API throws for a file that is not there.
const notFoundErrorName = "NotFoundError";

export interface ItemWriter {
  exists(
    folder: FileSystemDirectoryHandle,
    item: DownloadItem,
  ): Promise<boolean>;
  write(
    folder: FileSystemDirectoryHandle,
    item: DownloadItem,
  ): Promise<WriteOutcome>;
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
      const handle = await folder.getFileHandle(this.namer.nameFor(item));
      return (await handle.getFile()).size > 0;
    } catch (error) {
      // A file that is not there is a plain no; asking must not create it.
      if (error instanceof DOMException && error.name === notFoundErrorName)
        return false;
      throw error;
    }
  }

  async write(
    folder: FileSystemDirectoryHandle,
    item: DownloadItem,
  ): Promise<WriteOutcome> {
    if (await this.exists(folder, item)) return "skipped";
    try {
      const blob = await this.fetchBlob(item.url);
      const handle = await folder.getFileHandle(this.namer.nameFor(item), {
        create: true,
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return "saved";
    } catch {
      return "failed";
    }
  }
}
