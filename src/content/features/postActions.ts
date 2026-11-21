import { type ElementMaker, TAGS } from "../../shared/dom";
import type { IconButtons } from "../ui/ports";
import { ARTICLE, MAIN } from "../dom/selectors";
import { bySelector } from "../ui/classNames";
import type { ContainerDownload, Feature, PostButton } from "./feature";

// Marks the group of buttons beside a bookmark, for content.css and for
// finding it again.
export const POST_ACTIONS_CLASS = "igdl-post-actions";

// Instagram's bookmark icon, saved or not, marks every post's action bar.
const bookmarkIcon =
  'svg:has(> polygon[points="20 21 12 13.44 4 21 4 3 20 3 20 21"]), ' +
  'svg:has(> path[d^="M20 22a.999.999 0 0 1-.687-.273L12 14.815"])';

const loneChild = 1;

// The element that wraps an action bar's buttons.
const actionButton = '[role="button"], button';

// The outermost element around the bookmark that holds nothing else, which is
// the slot in the action bar our buttons go beside.
function actionSlot(icon: Element): Element | undefined {
  const button = icon.closest(actionButton);
  return button === null ? undefined : outermostAlone(button);
}

const isLone = (parent: Element | null): parent is Element =>
  parent?.childElementCount === loneChild;

function loneParent(element: Element): Element | undefined {
  const parent = element.parentElement;
  return isLone(parent) ? parent : undefined;
}

function outermostAlone(element: Element): Element {
  const parent = loneParent(element);
  return parent === undefined ? element : outermostAlone(parent);
}

// A slot already holding our buttons beside it is left alone.
const hasActions = (slot: Element): boolean =>
  Boolean(slot.parentElement?.querySelector(bySelector(POST_ACTIONS_CLASS)));

const isGroup = (element: Element | null): element is Element =>
  element !== null && element.childElementCount > loneChild;

// The feed keeps like, comment and share in one group and gives the bookmark
// the other half of a two-column grid, where anything put beside the bookmark
// takes its cell and pushes it onto a second row. There the buttons join the
// end of that group; a bar that is one plain row takes them before the bookmark.
function place(group: Element, slot: Element): void {
  const neighbour = slot.previousElementSibling;
  if (isGroup(neighbour)) neighbour.append(group);
  else slot.before(group);
}

export interface PostActionsDependencies {
  readonly document: ElementMaker & ParentNode;
  /** What each button does when pressed. */
  readonly action: ContainerDownload;
  /** The buttons beside the bookmark, in order. */
  readonly postButtons: readonly PostButton[];
  readonly buttons: IconButtons;
}

export class PostActions implements Feature {
  constructor(private readonly deps: PostActionsDependencies) {}

  scan(): void {
    for (const icon of this.deps.document.querySelectorAll(bookmarkIcon))
      this.addBeside(icon);
  }

  private addBeside(icon: Element): void {
    const slot = actionSlot(icon);
    if (slot !== undefined) this.fill(slot);
  }

  private fill(slot: Element): void {
    if (!hasActions(slot)) place(this.group(slot), slot);
  }

  private container(element: Element): ParentNode {
    return element.closest(ARTICLE) ?? this.mainOrPage(element);
  }

  private mainOrPage(element: Element): ParentNode {
    return element.closest(MAIN) ?? this.deps.document;
  }

  private group(slot: Element): HTMLElement {
    const group = this.deps.document.createElement(TAGS.span);
    group.className = POST_ACTIONS_CLASS;
    const container = this.container(slot);
    const shown = this.deps.postButtons.filter((button) =>
      button.shows(container),
    );
    for (const button of shown) group.append(this.element(button, container));
    return group;
  }

  private element(
    { label, className, all }: PostButton,
    container: ParentNode,
  ): HTMLElement {
    return this.deps.buttons.button({
      label,
      className,
      onClick: () => void this.deps.action.download(container, all),
    });
  }
}
