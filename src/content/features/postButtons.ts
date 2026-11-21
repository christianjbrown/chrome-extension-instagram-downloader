// The buttons beside a post's bookmark. The composition root lists them in
// the order they appear.
import type { CarouselCheck } from "../dom/ports";
import { BUTTON_CLASS, classes } from "../ui/classNames";
import type { PostButton } from "./feature";

// The icon each button beside the bookmark shows.
export const DOWNLOAD_CLASS = "igdl-download";
export const DOWNLOAD_ALL_CLASS = "igdl-download-all";

const text = {
  download: "Download",
  downloadAll: "Download all slides",
} as const;

/** Saves the slide showing, or the whole post when it is not a carousel. */
export class ShowingSlideButton implements PostButton {
  readonly label = text.download;
  readonly className = classes(BUTTON_CLASS, DOWNLOAD_CLASS);
  readonly all = false;

  shows(): boolean {
    return true;
  }
}

/** Saves every slide, and only shows on a carousel. */
export class AllSlidesButton implements PostButton {
  readonly label = text.downloadAll;
  readonly className = classes(BUTTON_CLASS, DOWNLOAD_ALL_CLASS);
  readonly all = true;

  constructor(private readonly carousel: CarouselCheck) {}

  shows(container: ParentNode): boolean {
    return this.carousel.isCarousel(container);
  }
}
