// What the features ask of the page's own elements.
import type { PostTarget } from "../actions/ports";

/** Finds the picture on screen that stands for a post, slide or story. */
export interface AssetFinder {
  largest(container: ParentNode): string | undefined;
}

/** Tells which post a container on the page shows. */
export interface PostLocator {
  /** Every slide when `all`, otherwise the one showing. */
  target(container: ParentNode, all: boolean): PostTarget | undefined;
}
