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

/** Recognises the addresses of one kind of page, from their path segments. */
export interface PathMatcher {
  match(segments: readonly string[]): Route | undefined;
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

/** Tells which slide of a carousel is showing. */
export interface SlideReader {
  /** The slide showing, counting from zero, or undefined for a single picture. */
  slide(container: ParentNode): number | undefined;
}

/** Tells whether a post is a carousel. */
export interface CarouselCheck {
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
