import { downloadItems, type InstagramMedia } from "../../shared/media";
import type { Bridge } from "../bridgeClient";
import { errorMessage } from "../errors";
import type { ItemDownloader } from "../saving/fileDownloader";
import type { Notifier } from "../ui/notifier";

/** A post found by id, optionally one slide of it, or by the picture on screen. */
export type PostTarget =
  | { readonly mediaId: string; readonly slide: number | undefined }
  | { readonly asset: string };

export class PostDownloader {
  constructor(
    private readonly bridge: Bridge,
    private readonly downloader: ItemDownloader,
    private readonly notifier: Notifier,
  ) {}

  /** `owner` names the files when the post itself does not say whose it is. */
  async download(target: PostTarget, owner?: string): Promise<void> {
    try {
      const items = downloadItems(await this.find(target), owner);
      const slide = "slide" in target ? target.slide : undefined;
      const chosen =
        slide === undefined ? items : items.slice(slide, slide + 1);
      if (chosen.length === 0) throw new Error("nothing to download");
      for (const item of chosen) await this.downloader.download(item);
    } catch (error) {
      this.notifier.error(
        `Could not download this post: ${errorMessage(error)}`,
      );
    }
  }

  private find(target: PostTarget): Promise<InstagramMedia> {
    return "mediaId" in target
      ? this.bridge.call("media", { mediaId: target.mediaId })
      : this.bridge.call("mediaByAsset", { asset: target.asset });
  }
}
