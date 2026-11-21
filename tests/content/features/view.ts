import { VisibleAssetFinder } from "../../../src/content/dom/visibleAsset";
import type { PageView } from "../../../src/content/features/feature";

export function view(
  pathname: string,
  html: string,
): PageView & { setPath(path: string): void } {
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
