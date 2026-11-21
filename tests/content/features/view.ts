import { DotCarousel } from "../../../src/content/dom/carousel";
import {
  routes as routeReaders,
  type Routes,
} from "../../../src/content/routeWiring";
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
export const routes = (page: TestPage): Routes =>
  routeReaders(() => page.pathname());

export const buttons = (): DomButtons => new DomButtons(document);

export const carousel = (): DotCarousel => new DotCarousel();
