import type { ErrorDescriber, MediaFiles } from "../ports";
import type { ItemDownloader } from "../saving/ports";
import type { Notifier } from "../ui/ports";
import type { MediaFinder, PostTarget, PostDownloads } from "./ports";

const text = {
  nothing: "nothing to download",
  failed: "Could not download this post",
} as const;

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
      const found = this.deps.finder.find(target);
      if (found === undefined) throw new Error(text.nothing);
      const items = this.deps.files.items(await found, owner);
      const { slide } = target;
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
}
