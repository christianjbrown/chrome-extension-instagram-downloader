import type { Reel } from "../../shared/bridge";
import { downloadItems, type InstagramMedia } from "../../shared/media";
import type { Bridge } from "../ports";
import type { ItemDownloader } from "../saving/ports";
import type { Notifier } from "../ui/ports";
import type { StoryRoute, StoryDownloads } from "./ports";
import { errorMessage } from "../errorText";

const text = {
  unknownStory: "could not tell which story is showing",
  failed: "Could not download this story",
} as const;

export class StoryDownloader implements StoryDownloads {
  constructor(
    private readonly bridge: Bridge,
    private readonly downloader: ItemDownloader,
    private readonly notifier: Notifier,
  ) {}

  async current(route: StoryRoute, asset: string | undefined): Promise<void> {
    await this.attempt(async () => {
      const media = await this.findCurrent(route, asset);
      const owner = route.kind === "story" ? route.username : undefined;
      return downloadItems(media, owner);
    });
  }

  async all(route: StoryRoute): Promise<void> {
    await this.attempt(async () => {
      const reel = await this.reel(route);
      return reel.items.flatMap((media) => downloadItems(media, reel.owner));
    });
  }

  private findCurrent(
    route: StoryRoute,
    asset: string | undefined,
  ): Promise<InstagramMedia> {
    if (route.kind === "story" && route.mediaId !== undefined)
      return this.bridge.call("media", { mediaId: route.mediaId });
    if (asset !== undefined) return this.bridge.call("mediaByAsset", { asset });
    return Promise.reject(new Error(text.unknownStory));
  }

  private reel(route: StoryRoute): Promise<Reel> {
    return route.kind === "story"
      ? this.bridge.call("userReel", { username: route.username })
      : this.bridge.call("reel", { reelId: route.highlightId });
  }

  private async attempt(
    items: () => Promise<ReturnType<typeof downloadItems>>,
  ): Promise<void> {
    try {
      for (const item of await items()) await this.downloader.download(item);
    } catch (error) {
      this.notifier.error(`${text.failed}: ${errorMessage(error)}`);
    }
  }
}
