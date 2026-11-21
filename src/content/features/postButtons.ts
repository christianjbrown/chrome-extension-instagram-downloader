// The buttons beside a post's bookmark. The composition root lists them in
// the order they appear.
import type { CarouselCheck } from "../dom/ports";
import { CLASS, classes } from "../ui/classNames";
import type { PostButton } from "./feature";

const text = {
  download: "Download",
  downloadAll: "Download all slides",
} as const;

/** Saves the slide showing, or the whole post when it is not a carousel. */
export class ShowingSlideButton implements PostButton {
  readonly label = text.download;
  readonly className = classes(CLASS.button, CLASS.download);
  readonly all = false;

  shows(): boolean {
    return true;
  }
}

/** Saves every slide, and only shows on a carousel. */
export class AllSlidesButton implements PostButton {
  readonly label = text.downloadAll;
  readonly className = classes(CLASS.button, CLASS.downloadAll);
  readonly all = true;

  constructor(private readonly carousel: CarouselCheck) {}

  shows(container: ParentNode): boolean {
    return this.carousel.isCarousel(container);
  }
}
