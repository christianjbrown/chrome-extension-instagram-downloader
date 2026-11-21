import type { DownloadItem, InstagramMedia } from "../../shared/media";
import type { ErrorDescriber, MediaFiles } from "../ports";
import type { ItemDownloader } from "../saving/ports";
import type { Notifier } from "../ui/ports";
import type { MediaFinder, PostTarget, PostDownloads } from "./ports";

const text = {
  nothing: "nothing to download",
  failed: "Could not download this post",
} as const;

// Every file of the post, or only the slide asked for.
const slideItems = (
  items: DownloadItem[],
  slide: number | undefined,
): DownloadItem[] =>
  slide === undefined ? items : items.slice(slide, slide + 1);

function nonEmpty(items: DownloadItem[]): DownloadItem[] {
  if (items.length === 0) throw new Error(text.nothing);
  return items;
}

export interface PostDownloaderDependencies {
  readonly finder: MediaFinder;
  readonly downloader: ItemDownloader;
  readonly notifier: Notifier;
  readonly files: MediaFiles;
  readonly errors: ErrorDescriber;
}

export class PostDownloader implements PostDownloads {
  constructor(private readonly deps: PostDownloaderDependencies) {}

  async download(target: PostTarget, owner?: string): Promise<void> {
    try {
      await this.save(target, owner);
    } catch (error) {
      this.deps.notifier.error(
        `${text.failed}: ${this.deps.errors.describe(error)}`,
      );
    }
  }

  private async save(target: PostTarget, owner?: string): Promise<void> {
    const media = await this.found(target);
    const items = this.deps.files.items(media, owner);
    for (const item of nonEmpty(slideItems(items, target.slide)))
      await this.deps.downloader.download(item);
  }

  private found(target: PostTarget): Promise<InstagramMedia> {
    const found = this.deps.finder.find(target);
    if (found === undefined) throw new Error(text.nothing);
    return found;
  }
}
