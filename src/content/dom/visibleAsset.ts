import { assetName } from "../../shared/media";
import { MEDIA_ELEMENTS } from "./selectors";

/** Finds the picture on screen that stands for a post, slide or story. */
export interface AssetFinder {
  largest(container: ParentNode): string | undefined;
}

/** How much of the page is on screen, read at click time. */
export interface Viewport {
  viewportHeight(): number;
}

function sourceOf(element: Element): string | undefined {
  if (element instanceof HTMLImageElement)
    return element.currentSrc || element.src;
  if (element instanceof HTMLVideoElement && element.poster !== "")
    return element.poster;
  return undefined;
}

// The CDN file name of the largest picture or video poster on screen inside
// a container, which identifies the post, slide or story being shown. Small
// pictures are avatars and icons, never the post.
export class VisibleAssetFinder implements AssetFinder {
  constructor(
    private readonly viewport: Viewport,
    private readonly minimumSide: number,
  ) {}

  largest(container: ParentNode): string | undefined {
    const viewportHeight = this.viewport.viewportHeight();
    let best: { asset: string; area: number } | undefined;
    for (const element of container.querySelectorAll(MEDIA_ELEMENTS)) {
      const source = sourceOf(element);
      const area = this.visibleArea(element, viewportHeight);
      if (source === undefined || area === 0) continue;
      if (best === undefined || area > best.area)
        best = { asset: assetName(source), area };
    }
    return best?.asset;
  }

  private visibleArea(element: Element, viewportHeight: number): number {
    const box = element.getBoundingClientRect();
    const onScreen = box.bottom > 0 && box.top < viewportHeight;
    const bigEnough =
      box.width >= this.minimumSide && box.height >= this.minimumSide;
    return onScreen && bigEnough ? box.width * box.height : 0;
  }
}
