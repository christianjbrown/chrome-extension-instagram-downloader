import { type ElementMaker, TAGS } from "../../shared/dom";
import type { DownloadItem } from "../../shared/media";
import type { FetchBlob, FileNamer, ItemDownloader } from "./ports";

interface ObjectUrls {
  createObjectURL(blob: Blob): string;
  revokeObjectURL(url: string): void;
}

// Saves one file through Chrome's normal download, into its download folder.
export class FileDownloader implements ItemDownloader {
  constructor(
    private readonly document: ElementMaker,
    private readonly fetchBlob: FetchBlob,
    private readonly urls: ObjectUrls,
    private readonly namer: FileNamer,
  ) {}

  async download(item: DownloadItem): Promise<void> {
    const url = this.urls.createObjectURL(await this.fetchBlob(item.url));
    const link = this.document.createElement(TAGS.anchor);
    link.href = url;
    link.download = this.namer.nameFor(item);
    link.click();
    this.urls.revokeObjectURL(url);
  }
}
