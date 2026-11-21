import { shortcodeFromPath } from "../../shared/shortcode";
import { CLASS } from "../ui/classNames";
import type { Thumbnail, ThumbnailSource } from "./ports";
import { ARTICLE } from "./selectors";

const thumbnail = 'a[href*="/p/"]:has(img), a[href*="/reel/"]:has(img)';

// Thumbnails on profile, explore, saved and tagged grids. Posts in the feed
// sit inside an article and get their own buttons, and narrow thumbnails are
// too small to hold one.
export class GridThumbnails implements ThumbnailSource {
  constructor(
    private readonly document: Document,
    private readonly minimumWidth: number,
  ) {}

  unmarked(): Thumbnail[] {
    return Array.from(
      this.document.querySelectorAll<HTMLAnchorElement>(thumbnail),
    ).flatMap((link) => {
      if (!this.wanted(link)) return [];
      const shortcode = shortcodeFromPath(link.pathname);
      return shortcode === undefined ? [] : [{ link, shortcode }];
    });
  }

  mark({ link }: Thumbnail): void {
    link.classList.add(CLASS.gridLink);
  }

  private wanted(link: HTMLAnchorElement): boolean {
    return (
      !link.classList.contains(CLASS.gridLink) &&
      link.closest(ARTICLE) === null &&
      link.getBoundingClientRect().width >= this.minimumWidth
    );
  }
}
