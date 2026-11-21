// The buttons over the story viewer. The composition root lists them in the
// order they appear.
import type { StoryDownloads, StoryRoute } from "../actions/ports";
import type { AssetFinder } from "../dom/ports";
import type { ButtonLook, StoryButton } from "./feature";

/** How the story buttons look. */
const STORY_BUTTON_LOOKS = {
  download: { icon: "download", label: "Download this story" },
  downloadAll: { icon: "download-all", label: "Download all" },
} as const satisfies Record<string, ButtonLook>;

/** Saves the story showing, found by the picture on screen when it has to be. */
export class CurrentStoryButton implements StoryButton {
  readonly look = STORY_BUTTON_LOOKS.download;

  constructor(
    private readonly downloader: StoryDownloads,
    private readonly assets: AssetFinder,
    private readonly document: Document,
  ) {}

  run(route: StoryRoute): Promise<void> {
    return this.downloader.current(route, this.assets.largest(this.document));
  }
}

/** Saves every story in the reel or highlight. */
export class AllStoriesButton implements StoryButton {
  readonly look = STORY_BUTTON_LOOKS.downloadAll;

  constructor(private readonly downloader: StoryDownloads) {}

  run(route: StoryRoute): Promise<void> {
    return this.downloader.all(route);
  }
}
