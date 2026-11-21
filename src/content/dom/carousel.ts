// Which slide of a carousel is showing, from Instagram's dot indicators.
// Instagram draws at most six dots, so the dot's label, not its position,
// carries the slide number.
import { ATTRIBUTES } from "../../shared/dom";
import type { CarouselReader } from "./ports";
import { CURRENT_SLIDE_DOT } from "./selectors";

export class DotCarousel implements CarouselReader {
  slide(container: ParentNode): number | undefined {
    const active = container.querySelector(CURRENT_SLIDE_DOT);
    if (active === null) return undefined;
    const number = /\d+/.exec(active.getAttribute(ATTRIBUTES.ariaLabel) ?? "");
    if (number !== null) return Number(number[0]) - 1;
    const dots = Array.from(active.parentElement?.children ?? [active]);
    return dots.indexOf(active);
  }

  isCarousel(container: ParentNode): boolean {
    return this.slide(container) !== undefined;
  }
}
