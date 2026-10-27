import { assetName } from "../../shared/media";

const minimumSide = 150;

function sourceOf(element: Element): string | undefined {
  if (element instanceof HTMLImageElement)
    return element.currentSrc || element.src;
  if (element instanceof HTMLVideoElement && element.poster !== "")
    return element.poster;
  return undefined;
}

function visibleArea(element: Element, viewportHeight: number): number {
  const box = element.getBoundingClientRect();
  const onScreen = box.bottom > 0 && box.top < viewportHeight;
  const bigEnough = box.width >= minimumSide && box.height >= minimumSide;
  return onScreen && bigEnough ? box.width * box.height : 0;
}

// The CDN file name of the largest picture or video poster on screen inside
// a container, which identifies the post, slide or story being shown.
export function largestVisibleAsset(
  container: ParentNode,
  viewportHeight: number,
): string | undefined {
  let best: { asset: string; area: number } | undefined;
  for (const element of container.querySelectorAll("img, video")) {
    const source = sourceOf(element);
    const area = visibleArea(element, viewportHeight);
    if (source === undefined || area === 0) continue;
    if (best === undefined || area > best.area)
      best = { asset: assetName(source), area };
  }
  return best?.asset;
}
