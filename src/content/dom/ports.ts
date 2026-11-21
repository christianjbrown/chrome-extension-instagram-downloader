// What the features ask of the page's own elements.
import type { PostTarget } from "../actions/ports";
import type { Route } from "./route";

/** Finds the picture on screen that stands for a post, slide or story. */
export interface AssetFinder {
  largest(container: ParentNode): string | undefined;
}

/** Tells which post a container on the page shows. */
export interface PostLocator {
  /** Every slide when `all`, otherwise the one showing. */
  target(container: ParentNode, all: boolean): PostTarget | undefined;
}

/** Turns an address path into the kind of page it shows. */
export interface RouteParser {
  parse(pathname: string): Route;
}

/** Recognises one kind of page. */
export interface RouteKind<R extends Route> {
  matches(route: Route): route is R;
}

/** The page the address shows now, when it is one kind of page. */
export interface RouteReader<R extends Route> {
  read(): R | undefined;
}

/** Reads a carousel's dot indicators. */
export interface CarouselReader {
  /** The slide showing, counting from zero, or undefined for a single picture. */
  slide(container: ParentNode): number | undefined;
  isCarousel(container: ParentNode): boolean;
}

/** A grid thumbnail that has no download button yet. */
export interface Thumbnail {
  readonly link: HTMLAnchorElement;
  readonly shortcode: string;
}

/** Finds the grid thumbnails still waiting for a button. */
export interface ThumbnailSource {
  unmarked(): Thumbnail[];
  /** Notes that a thumbnail has its button, so it is not found again. */
  mark(thumbnail: Thumbnail): void;
}
