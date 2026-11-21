import type { ClassOf } from "../../shared/members";
import { shortcodeFromPath } from "../../shared/shortcode";
import type { Thumbnail, ThumbnailSource } from "./ports";
import { ARTICLE } from "./selectors";

// Marks a thumbnail that has its button, so it is not found again.
export const GRID_LINK_CLASS = "igdl-grid-link";

const thumbnail = 'a[href*="/p/"]:has(img), a[href*="/reel/"]:has(img)';

// Thumbnails on profile, explore, saved and tagged grids. Posts in the feed
// sit inside an article and get their own buttons, and narrow thumbnails are
// too small to hold one.
export class GridThumbnails implements ThumbnailSource {
  constructor(
    private readonly document: Document,
    private readonly minimumWidth: number,
    // Links are checked against the window's own anchor class.
    private readonly anchors: ClassOf<HTMLAnchorElement>,
  ) {}

  unmarked(): Thumbnail[] {
    return Array.from(this.document.querySelectorAll(thumbnail))
      .filter((element) => this.isLink(element))
      .flatMap((link) => (this.wanted(link) ? this.thumbnailOf(link) : []));
  }

  private isLink(element: Element): element is HTMLAnchorElement {
    return element instanceof this.anchors;
  }

  mark({ link }: Thumbnail): void {
    link.classList.add(GRID_LINK_CLASS);
  }

  // A link that names no post is left out.
  private thumbnailOf(link: HTMLAnchorElement): Thumbnail[] {
    const shortcode = shortcodeFromPath(link.pathname);
    return shortcode === undefined ? [] : [{ link, shortcode }];
  }

  private wanted(link: HTMLAnchorElement): boolean {
    return !link.classList.contains(GRID_LINK_CLASS) && this.fitsGrid(link);
  }

  private fitsGrid(link: HTMLAnchorElement): boolean {
    return (
      link.closest(ARTICLE) === null &&
      link.getBoundingClientRect().width >= this.minimumWidth
    );
  }
}
