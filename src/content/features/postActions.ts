import { shortcodeFromPath, shortcodeToMediaId } from "../../shared/shortcode";
import type { PostDownloader, PostTarget } from "../actions/postDownloader";
import { carouselSlide, isCarousel } from "../dom/carousel";
import { parseRoute } from "../dom/route";
import type { AssetFinder } from "../dom/visibleAsset";
import { ARTICLE, MAIN } from "../dom/selectors";
import { createButton } from "../ui/buttons";
import { bySelector, CLASS, classes } from "../ui/classNames";
import type { Notifier } from "../ui/notifier";
import type { Feature, PageView } from "./feature";

// Instagram's bookmark icon, saved or not, marks every post's action bar.
const bookmarkIcon =
  'svg:has(> polygon[points="20 21 12 13.44 4 21 4 3 20 3 20 21"]), ' +
  'svg:has(> path[d^="M20 22a.999.999 0 0 1-.687-.273L12 14.815"])';

const loneChild = 1;

const postLink = 'a[href*="/p/"], a[href*="/reel/"]';

// The element that wraps an action bar's buttons.
const actionButton = '[role="button"], button';

const text = {
  download: "Download",
  downloadAll: "Download all slides",
  unknownPost: "Could not tell which post this is.",
} as const;

// The outermost element around the bookmark that holds nothing else, which is
// the slot in the action bar our buttons go beside.
function actionSlot(icon: Element): Element | undefined {
  let slot = icon.closest(actionButton);
  while (slot?.parentElement?.childElementCount === loneChild)
    slot = slot.parentElement;
  return slot ?? undefined;
}

// The feed keeps like, comment and share in one group and gives the bookmark
// the other half of a two-column grid, where anything put beside the bookmark
// takes its cell and pushes it onto a second row. There the buttons join the
// end of that group; a bar that is one plain row takes them before the bookmark.
function place(group: Element, slot: Element): void {
  const neighbour = slot.previousElementSibling;
  if (neighbour !== null && neighbour.childElementCount > loneChild)
    neighbour.append(group);
  else slot.before(group);
}

export class PostActions implements Feature {
  constructor(
    private readonly view: PageView,
    private readonly downloader: PostDownloader,
    private readonly notifier: Notifier,
    private readonly assets: AssetFinder,
  ) {}

  scan(): void {
    for (const icon of this.view.document.querySelectorAll(bookmarkIcon)) {
      const slot = actionSlot(icon);
      if (slot === undefined) continue;
      if (slot.parentElement?.querySelector(bySelector(CLASS.postActions)))
        continue;
      place(this.buttons(slot), slot);
    }
  }

  private container(element: Element): ParentNode {
    return (
      element.closest(ARTICLE) ?? element.closest(MAIN) ?? this.view.document
    );
  }

  private buttons(slot: Element): HTMLElement {
    const group = this.view.document.createElement("span");
    group.className = CLASS.postActions;
    const container = this.container(slot);
    const add = (label: string, className: string, all: boolean): void => {
      group.append(
        createButton(this.view.document, {
          label,
          className,
          onClick: () => void this.download(container, all),
        }),
      );
    };
    add(text.download, classes(CLASS.button, CLASS.download), false);
    if (isCarousel(container))
      add(text.downloadAll, classes(CLASS.button, CLASS.downloadAll), true);
    return group;
  }

  private async download(container: ParentNode, all: boolean): Promise<void> {
    const target = this.target(container, all);
    if (target === undefined) {
      this.notifier.error(text.unknownPost);
      return;
    }
    await this.downloader.download(target);
  }

  private target(container: ParentNode, all: boolean): PostTarget | undefined {
    const shortcode = this.shortcode(container);
    if (shortcode !== undefined)
      return {
        mediaId: shortcodeToMediaId(shortcode),
        slide: all ? undefined : carouselSlide(container),
      };
    const asset = this.assets.largest(container);
    return asset === undefined ? undefined : { asset };
  }

  // In the feed each post links to itself; on a post's own page the address
  // names it, and links further down lead to other posts.
  private shortcode(container: ParentNode): string | undefined {
    const route = parseRoute(this.view.pathname());
    if (route.kind === "post") return route.shortcode;
    const href = container.querySelector(postLink)?.getAttribute("href");
    return href ? shortcodeFromPath(href) : undefined;
  }
}
