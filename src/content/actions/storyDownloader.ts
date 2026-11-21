import type { DownloadItem } from "../../shared/media";
import type { ErrorDescriber, MediaFiles } from "../ports";
import type { ItemDownloader } from "../saving/ports";
import type { Notifier } from "../ui/ports";
import type {
  MediaFinder,
  StoryDownloads,
  StoryKind,
  StoryRoute,
} from "./ports";

const text = {
  unknownStory: "could not tell which story is showing",
  failed: "Could not download this story",
} as const;

export interface StoryDownloaderDependencies {
  /** Finds the story showing, by its id or by the picture on screen. */
  readonly finder: MediaFinder;
  readonly downloader: ItemDownloader;
  readonly notifier: Notifier;
  readonly files: MediaFiles;
  readonly errors: ErrorDescriber;
  /** Each kind of story page, tried in order. */
  readonly kinds: readonly StoryKind<StoryRoute>[];
}

export class StoryDownloader implements StoryDownloads {
  constructor(private readonly deps: StoryDownloaderDependencies) {}

  async current(route: StoryRoute, asset: string | undefined): Promise<void> {
    await this.attempt(async () => {
      const kind = this.kind(route);
      const found = this.deps.finder.find({
        mediaId: kind.mediaId(route),
        asset,
      });
      if (found === undefined) throw new Error(text.unknownStory);
      return this.deps.files.items(await found, kind.owner(route));
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

  private async attempt(items: () => Promise<DownloadItem[]>): Promise<void> {
    try {
      for (const item of await items())
        await this.deps.downloader.download(item);
    } catch (error) {
      this.deps.notifier.error(
        `${text.failed}: ${this.deps.errors.describe(error)}`,
      );
    }
  }
}
