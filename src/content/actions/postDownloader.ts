import type { InstagramMedia } from "../../shared/media";
import type { Bridge, ErrorDescriber, MediaFiles } from "../ports";
import type { ItemDownloader } from "../saving/ports";
import type { Notifier } from "../ui/ports";
import type { PostTarget, PostDownloads } from "./ports";

const text = {
  nothing: "nothing to download",
  failed: "Could not download this post",
} as const;

export interface PostDownloaderDependencies {
  readonly bridge: Bridge;
  readonly downloader: ItemDownloader;
  readonly notifier: Notifier;
  readonly files: MediaFiles;
  readonly errors: ErrorDescriber;
}

export class PostDownloader implements PostDownloads {
  constructor(private readonly deps: PostDownloaderDependencies) {}

  async download(target: PostTarget, owner?: string): Promise<void> {
    try {
      const items = this.deps.files.items(await this.find(target), owner);
      const slide = "slide" in target ? target.slide : undefined;
      const chosen =
        slide === undefined ? items : items.slice(slide, slide + 1);
      if (chosen.length === 0) throw new Error(text.nothing);
      for (const item of chosen) await this.deps.downloader.download(item);
    } catch (error) {
      this.deps.notifier.error(
        `${text.failed}: ${this.deps.errors.describe(error)}`,
      );
    }
  }

  private find(target: PostTarget): Promise<InstagramMedia> {
    return "mediaId" in target
      ? this.deps.bridge.call("media", { mediaId: target.mediaId })
      : this.deps.bridge.call("mediaByAsset", { asset: target.asset });
  }
}
