// Which slide of a carousel is showing, from Instagram's dot indicators.
// Instagram draws at most six dots, so the dot's label, not its position,
// carries the slide number.
import { ATTRIBUTES } from "../../shared/dom";
import type { CarouselCheck, SlideReader } from "./ports";
import { CURRENT_SLIDE_DOT } from "./selectors";

const slideNumber = /\d+/;

const label = (dot: Element): string =>
  dot.getAttribute(ATTRIBUTES.ariaLabel) ?? "";

// The label counts slides from one.
function labelledSlide(dot: Element): number | undefined {
  const number = slideNumber.exec(label(dot));
  return number === null ? undefined : Number(number[0]) - 1;
}

const siblingsOf = (dot: Element): HTMLCollection | undefined =>
  dot.parentElement?.children;

// With no number in its label, a dot's place among the others is the slide.
const dotIndex = (dot: Element): number =>
  Array.from(siblingsOf(dot) ?? [dot]).indexOf(dot);

export class DotCarousel implements SlideReader, CarouselCheck {
  slide(container: ParentNode): number | undefined {
    const active = container.querySelector(CURRENT_SLIDE_DOT);
    return active === null ? undefined : this.position(active);
  }

  private position(active: Element): number {
    return labelledSlide(active) ?? dotIndex(active);
  }

  isCarousel(container: ParentNode): boolean {
    return this.slide(container) !== undefined;
  }
}
