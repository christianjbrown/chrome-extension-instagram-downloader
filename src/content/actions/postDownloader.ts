import { downloadItems, type InstagramMedia } from "../../shared/media";
import type { Bridge } from "../ports";
import type { ItemDownloader } from "../saving/ports";
import type { Notifier } from "../ui/ports";
import type { PostTarget, PostDownloads } from "./ports";
import { errorMessage } from "../errorText";

const text = {
  nothing: "nothing to download",
  failed: "Could not download this post",
} as const;

export class PostDownloader implements PostDownloads {
  constructor(
    private readonly bridge: Bridge,
    private readonly downloader: ItemDownloader,
    private readonly notifier: Notifier,
  ) {}

  async download(target: PostTarget, owner?: string): Promise<void> {
    try {
      const items = downloadItems(await this.find(target), owner);
      const slide = "slide" in target ? target.slide : undefined;
      const chosen =
        slide === undefined ? items : items.slice(slide, slide + 1);
      if (chosen.length === 0) throw new Error(text.nothing);
      for (const item of chosen) await this.downloader.download(item);
    } catch (error) {
      this.notifier.error(`${text.failed}: ${errorMessage(error)}`);
    }
  }

  private find(target: PostTarget): Promise<InstagramMedia> {
    return "mediaId" in target
      ? this.bridge.call("media", { mediaId: target.mediaId })
      : this.bridge.call("mediaByAsset", { asset: target.asset });
  }
}
