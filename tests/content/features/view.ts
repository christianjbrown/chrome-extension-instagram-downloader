import { AddressRoute } from "../../../src/content/dom/addressRoute";
import { DotCarousel } from "../../../src/content/dom/carousel";
import type { StoryRoute } from "../../../src/content/actions/ports";
import type { RouteReader } from "../../../src/content/dom/ports";
import {
  PathRouteParser,
  type PostRoute,
  type ProfileRoute,
} from "../../../src/content/dom/route";
import {
  PostPage,
  ProfilePage,
  StoryPage,
} from "../../../src/content/dom/routeKinds";
import { VisibleAssetFinder } from "../../../src/content/dom/visibleAsset";
import { DomButtons } from "../../../src/content/ui/buttons";

/** A page at an address the test can change. */
export interface TestPage {
  readonly document: Document;
  pathname(): string;
  setPath(path: string): void;
}

export function view(pathname: string, html: string): TestPage {
  document.body.innerHTML = html;
  let path = pathname;
  return {
    document,
    pathname: () => path,
    setPath: (next) => {
      path = next;
    },
  };
}

/** Finds pictures on a screen 800 pixels tall. */
export const assets = (): VisibleAssetFinder =>
  new VisibleAssetFinder({ viewportHeight: () => 800 }, 150);

export const bookmark =
  '<svg><polygon points="20 21 12 13.44 4 21 4 3 20 3 20 21"></polygon></svg>';

export function click(selector: string): void {
  document.querySelector<HTMLElement>(selector)?.click();
}

/** The address readers the content script builds, over a test page. */
export function routes(page: TestPage): {
  posts: RouteReader<PostRoute>;
  profiles: RouteReader<ProfileRoute>;
  stories: RouteReader<StoryRoute>;
} {
  const parser = new PathRouteParser();
  const pathname = (): string => page.pathname();
  return {
    posts: new AddressRoute(pathname, parser, new PostPage()),
    profiles: new AddressRoute(pathname, parser, new ProfilePage()),
    stories: new AddressRoute(pathname, parser, new StoryPage()),
  };
}

export const buttons = (): DomButtons => new DomButtons(document);

export const carousel = (): DotCarousel => new DotCarousel();
