import type { DownloadItem } from "../../shared/media";
import type { FetchBlob } from "./fetchBlob";
import type { FileNamer } from "./fileNamer";

export interface ItemDownloader {
  download(item: DownloadItem): Promise<void>;
}

interface ObjectUrls {
  createObjectURL(blob: Blob): string;
  revokeObjectURL(url: string): void;
}

// Saves one file through Chrome's normal download, into its download folder.
export class FileDownloader implements ItemDownloader {
  constructor(
    private readonly document: Document,
    private readonly fetchBlob: FetchBlob,
    private readonly urls: ObjectUrls,
    private readonly namer: FileNamer,
  ) {}

  async download(item: DownloadItem): Promise<void> {
    const url = this.urls.createObjectURL(await this.fetchBlob(item.url));
    const link = this.document.createElement("a");
    link.href = url;
    link.download = this.namer.nameFor(item);
    link.click();
    this.urls.revokeObjectURL(url);
  }
}
