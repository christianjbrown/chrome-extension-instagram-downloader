import { TAGS } from "../../shared/dom";
import type { PostDownloads } from "../actions/ports";
import type { PostLocator } from "../dom/ports";
import type { Notifier } from "../ui/ports";
import { isCarousel } from "../dom/carousel";
import { ARTICLE, MAIN } from "../dom/selectors";
import { createButton } from "../ui/buttons";
import { bySelector, CLASS, classes } from "../ui/classNames";
import type { Feature, PageView } from "./feature";

// Instagram's bookmark icon, saved or not, marks every post's action bar.
const bookmarkIcon =
  'svg:has(> polygon[points="20 21 12 13.44 4 21 4 3 20 3 20 21"]), ' +
  'svg:has(> path[d^="M20 22a.999.999 0 0 1-.687-.273L12 14.815"])';

const loneChild = 1;

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

interface PostButton {
  readonly label: string;
  readonly className: string;
  /** Saves every slide rather than the one showing. */
  readonly all: boolean;
  readonly shows: (container: ParentNode) => boolean;
}

// The buttons beside the bookmark, in order.
const postButtons: readonly PostButton[] = [
  {
    label: text.download,
    className: classes(CLASS.button, CLASS.download),
    all: false,
    shows: () => true,
  },
  {
    label: text.downloadAll,
    className: classes(CLASS.button, CLASS.downloadAll),
    all: true,
    shows: isCarousel,
  },
];

export class PostActions implements Feature {
  constructor(
    private readonly view: PageView,
    private readonly downloader: PostDownloads,
    private readonly notifier: Notifier,
    private readonly locator: PostLocator,
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
    const group = this.view.document.createElement(TAGS.span);
    group.className = CLASS.postActions;
    const container = this.container(slot);
    for (const { label, className, all, shows } of postButtons) {
      if (!shows(container)) continue;
      group.append(
        createButton(this.view.document, {
          label,
          className,
          onClick: () => void this.download(container, all),
        }),
      );
    }
    return group;
  }

  private async download(container: ParentNode, all: boolean): Promise<void> {
    const target = this.locator.target(container, all);
    if (target === undefined) {
      this.notifier.error(text.unknownPost);
      return;
    }
    await this.downloader.download(target);
  }
}
