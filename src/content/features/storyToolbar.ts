import { TAGS } from "../../shared/dom";
import type { StoryDownloads, StoryRoute } from "../actions/ports";
import type { AssetFinder, RouteReader } from "../dom/ports";
import { bySelector, CLASS } from "../ui/classNames";
import { textButtonClass, type ButtonIcon } from "../ui/buttons";
import type { TextButtons } from "../ui/ports";
import type { Feature } from "./feature";

const text = {
  download: "Download this story",
  downloadAll: "Download all",
} as const;

export interface StoryToolbarDependencies {
  readonly document: Document;
  readonly downloader: StoryDownloads;
  readonly assets: AssetFinder;
  readonly stories: RouteReader<StoryRoute>;
  readonly buttons: TextButtons;
}

// Download buttons floating over the story viewer, for stories and highlights.
export class StoryToolbar implements Feature {
  constructor(private readonly deps: StoryToolbarDependencies) {}

  scan(): void {
    const { document } = this.deps;
    const existing = document.querySelector(bySelector(CLASS.storyToolbar));
    if (this.deps.stories.read() === undefined) {
      existing?.remove();
      return;
    }
    if (existing === null) document.body.append(this.toolbar());
  }

  private toolbar(): HTMLElement {
    const { document, downloader, assets } = this.deps;
    const toolbar = document.createElement(TAGS.div);
    toolbar.className = CLASS.storyToolbar;
    this.add(toolbar, "download", text.download, (route) =>
      downloader.current(route, assets.largest(document)),
    );
    this.add(toolbar, "download-all", text.downloadAll, (route) =>
      downloader.all(route),
    );
    return toolbar;
  }

  private add(
    toolbar: HTMLElement,
    icon: ButtonIcon,
    label: string,
    run: (route: StoryRoute) => Promise<void>,
  ): void {
    toolbar.append(
      this.deps.buttons.textButton({
        label,
        className: textButtonClass(icon),
        onClick: () => {
          const route = this.deps.stories.read();
          if (route !== undefined) void run(route);
        },
      }),
    );
  }
}
