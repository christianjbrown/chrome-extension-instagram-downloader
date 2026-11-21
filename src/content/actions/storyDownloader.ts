import type { DownloadItem, InstagramMedia } from "../../shared/media";
import type { Bridge, MediaFiles } from "../ports";
import type { ItemDownloader } from "../saving/ports";
import type { Notifier } from "../ui/ports";
import type { StoryDownloads, StoryKind, StoryRoute } from "./ports";
import { errorMessage } from "../errorText";

const text = {
  unknownStory: "could not tell which story is showing",
  failed: "Could not download this story",
} as const;

export interface StoryDownloaderDependencies {
  readonly bridge: Bridge;
  readonly downloader: ItemDownloader;
  readonly notifier: Notifier;
  readonly files: MediaFiles;
  /** Each kind of story page, tried in order. */
  readonly kinds: readonly StoryKind<StoryRoute>[];
}

export class StoryDownloader implements StoryDownloads {
  constructor(private readonly deps: StoryDownloaderDependencies) {}

  async current(route: StoryRoute, asset: string | undefined): Promise<void> {
    await this.attempt(async () => {
      const kind = this.kind(route);
      const media = await this.findCurrent(kind.mediaId(route), asset);
      return this.deps.files.items(media, kind.owner(route));
    });
  }

  async all(route: StoryRoute): Promise<void> {
    await this.attempt(async () => {
      const reel = await this.kind(route).reel(route);
      return reel.items.flatMap((media) =>
        this.deps.files.items(media, reel.owner),
      );
    });
  }

  // Each kind of story page is read by its own strategy; the first that
  // recognises the route wins.
  private kind(route: StoryRoute): StoryKind<StoryRoute> {
    const kind = this.deps.kinds.find((candidate) => candidate.matches(route));
    if (kind === undefined) throw new Error(text.unknownStory);
    return kind;
  }

  private findCurrent(
    mediaId: string | undefined,
    asset: string | undefined,
  ): Promise<InstagramMedia> {
    if (mediaId !== undefined)
      return this.deps.bridge.call("media", { mediaId });
    if (asset !== undefined)
      return this.deps.bridge.call("mediaByAsset", { asset });
    return Promise.reject(new Error(text.unknownStory));
  }

  private async attempt(items: () => Promise<DownloadItem[]>): Promise<void> {
    try {
      for (const item of await items())
        await this.deps.downloader.download(item);
    } catch (error) {
      this.deps.notifier.error(`${text.failed}: ${errorMessage(error)}`);
    }
  }
}
