import { TAGS } from "../../shared/dom";
import type { PostDownloads } from "../actions/ports";
import type { PostLocator } from "../dom/ports";
import type { ButtonFactory, Notifier } from "../ui/ports";
import { ARTICLE, MAIN } from "../dom/selectors";
import { bySelector, CLASS } from "../ui/classNames";
import type { Feature, PostButton } from "./feature";

// Instagram's bookmark icon, saved or not, marks every post's action bar.
const bookmarkIcon =
  'svg:has(> polygon[points="20 21 12 13.44 4 21 4 3 20 3 20 21"]), ' +
  'svg:has(> path[d^="M20 22a.999.999 0 0 1-.687-.273L12 14.815"])';

const loneChild = 1;

// The element that wraps an action bar's buttons.
const actionButton = '[role="button"], button';

const text = {
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

export interface PostActionsDependencies {
  readonly document: Document;
  readonly downloader: PostDownloads;
  readonly notifier: Notifier;
  readonly locator: PostLocator;
  /** The buttons beside the bookmark, in order. */
  readonly postButtons: readonly PostButton[];
  readonly buttons: ButtonFactory;
}

export class PostActions implements Feature {
  constructor(private readonly deps: PostActionsDependencies) {}

  scan(): void {
    for (const icon of this.deps.document.querySelectorAll(bookmarkIcon)) {
      const slot = actionSlot(icon);
      if (slot === undefined) continue;
      if (slot.parentElement?.querySelector(bySelector(CLASS.postActions)))
        continue;
      place(this.group(slot), slot);
    }
  }

  private container(element: Element): ParentNode {
    return (
      element.closest(ARTICLE) ?? element.closest(MAIN) ?? this.deps.document
    );
  }

  private group(slot: Element): HTMLElement {
    const group = this.deps.document.createElement(TAGS.span);
    group.className = CLASS.postActions;
    const container = this.container(slot);
    for (const button of this.deps.postButtons) {
      if (!button.shows(container)) continue;
      const { label, className, all } = button;
      group.append(
        this.deps.buttons.button({
          label,
          className,
          onClick: () => void this.download(container, all),
        }),
      );
    }
    return group;
  }

  private async download(container: ParentNode, all: boolean): Promise<void> {
    const target = this.deps.locator.target(container, all);
    if (target === undefined) {
      this.deps.notifier.error(text.unknownPost);
      return;
    }
    await this.deps.downloader.download(target);
  }
}
