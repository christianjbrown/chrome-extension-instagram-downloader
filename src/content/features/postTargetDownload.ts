// What a button beside a post's bookmark does: works out which post, or
// which slide of it, the button sits on, and saves it.
import type { PostDownloads } from "../actions/ports";
import type { PostLocator } from "../dom/ports";
import type { Notifier } from "../ui/ports";
import type { ContainerDownload } from "./feature";

const text = {
  unknownPost: "Could not tell which post this is.",
} as const;

export class PostTargetDownload implements ContainerDownload {
  constructor(
    private readonly locator: PostLocator,
    private readonly downloader: PostDownloads,
    private readonly notifier: Notifier,
  ) {}

  async download(container: ParentNode, all: boolean): Promise<void> {
    const target = this.locator.target(container, all);
    if (target === undefined) {
      this.notifier.error(text.unknownPost);
      return;
    }
    await this.downloader.download(target);
  }
}
