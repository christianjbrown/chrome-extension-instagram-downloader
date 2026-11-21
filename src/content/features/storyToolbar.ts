import { TAGS } from "../../shared/dom";
import type { StoryDownloads, StoryRoute } from "../actions/ports";
import type { AssetFinder } from "../dom/ports";
import { parseRoute } from "../dom/route";
import { bySelector, CLASS } from "../ui/classNames";
import {
  createTextButton,
  textButtonClass,
  type ButtonIcon,
} from "../ui/buttons";
import type { Feature, PageView } from "./feature";

const text = {
  download: "Download this story",
  downloadAll: "Download all",
} as const;

function storyRoute(pathname: string): StoryRoute | undefined {
  const route = parseRoute(pathname);
  return route.kind === "story" || route.kind === "highlight"
    ? route
    : undefined;
}

// Download buttons floating over the story viewer, for stories and highlights.
export class StoryToolbar implements Feature {
  constructor(
    private readonly view: PageView,
    private readonly downloader: StoryDownloads,
    private readonly assets: AssetFinder,
  ) {}

  scan(): void {
    const existing = this.view.document.querySelector(
      bySelector(CLASS.storyToolbar),
    );
    if (storyRoute(this.view.pathname()) === undefined) {
      existing?.remove();
      return;
    }
    if (existing === null) this.view.document.body.append(this.toolbar());
  }

  private toolbar(): HTMLElement {
    const toolbar = this.view.document.createElement(TAGS.div);
    toolbar.className = CLASS.storyToolbar;
    this.add(toolbar, "download", text.download, (route) =>
      this.downloader.current(route, this.assets.largest(this.view.document)),
    );
    this.add(toolbar, "download-all", text.downloadAll, (route) =>
      this.downloader.all(route),
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
      createTextButton(this.view.document, {
        label,
        className: textButtonClass(icon),
        onClick: () => {
          const route = storyRoute(this.view.pathname());
          if (route !== undefined) void run(route);
        },
      }),
    );
  }
}
