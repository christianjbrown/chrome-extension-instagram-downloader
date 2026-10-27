import type { StoryDownloader, StoryRoute } from "../actions/storyDownloader";
import { parseRoute } from "../dom/route";
import { largestVisibleAsset } from "../dom/visibleAsset";
import { createTextButton } from "../ui/buttons";
import type { Feature, PageView } from "./feature";

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
    private readonly downloader: StoryDownloader,
  ) {}

  scan(): void {
    const existing = this.view.document.querySelector(".igdl-story-toolbar");
    if (storyRoute(this.view.pathname()) === undefined) {
      existing?.remove();
      return;
    }
    if (existing === null) this.view.document.body.append(this.toolbar());
  }

  private toolbar(): HTMLElement {
    const toolbar = this.view.document.createElement("div");
    toolbar.className = "igdl-story-toolbar";
    this.add(toolbar, "Download this story", (route) =>
      this.downloader.current(
        route,
        largestVisibleAsset(this.view.document, this.view.viewportHeight()),
      ),
    );
    this.add(toolbar, "Download all", (route) => this.downloader.all(route));
    return toolbar;
  }

  private add(
    toolbar: HTMLElement,
    label: string,
    run: (route: StoryRoute) => Promise<void>,
  ): void {
    toolbar.append(
      createTextButton(this.view.document, {
        label,
        className: "igdl-link-button",
        onClick: () => {
          const route = storyRoute(this.view.pathname());
          if (route !== undefined) void run(route);
        },
      }),
    );
  }
}
