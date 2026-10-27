import { fileName, type DownloadItem } from "../../shared/media";
import type { FetchBlob } from "./fetchBlob";

export type WriteOutcome = "saved" | "skipped" | "failed";

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

// Writes files into a folder the user chose. A file that fails is left empty
// so the next run tries it again.
export class DirectoryWriter implements ItemWriter {
  constructor(private readonly fetchBlob: FetchBlob) {}

  async exists(
    folder: FileSystemDirectoryHandle,
    item: DownloadItem,
  ): Promise<boolean> {
    const handle = await folder.getFileHandle(fileName(item), { create: true });
    return (await handle.getFile()).size > 0;
  }

  async write(
    folder: FileSystemDirectoryHandle,
    item: DownloadItem,
  ): Promise<WriteOutcome> {
    if (await this.exists(folder, item)) return "skipped";
    try {
      const blob = await this.fetchBlob(item.url);
      const handle = await folder.getFileHandle(fileName(item), {
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
