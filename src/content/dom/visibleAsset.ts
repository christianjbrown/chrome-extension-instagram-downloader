import { assetName } from "../../shared/media";
import { sourceOf } from "./mediaSource";
import { MEDIA_ELEMENTS } from "./selectors";
import type { AssetFinder } from "./ports";

/** How much of the page is on screen, read at click time. */
export interface Viewport {
  viewportHeight(): number;
}

// No part of the element is on screen at a size worth counting.
const notShown = 0;

interface Candidate {
  readonly source: string;
  readonly area: number;
}

const shown = (source: string, area: number): Candidate[] =>
  area === notShown ? [] : [{ source, area }];

const candidateOf = (source: string | undefined, area: number): Candidate[] =>
  source === undefined ? [] : shown(source, area);

// The first of two the same size stays the largest.
const isLarger = (candidate: Candidate, best: Candidate | undefined): boolean =>
  best === undefined || candidate.area > best.area;

const larger = (
  best: Candidate | undefined,
  candidate: Candidate,
): Candidate | undefined => (isLarger(candidate, best) ? candidate : best);

const isOnScreen = (box: DOMRect, viewportHeight: number): boolean =>
  box.bottom > 0 && box.top < viewportHeight;

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
    const best = Array.from(container.querySelectorAll(MEDIA_ELEMENTS))
      .flatMap((element) => this.candidate(element, viewportHeight))
      .reduce<Candidate | undefined>(larger, undefined);
    return best === undefined ? undefined : assetName(best.source);
  }

  private candidate(element: Element, viewportHeight: number): Candidate[] {
    return candidateOf(
      sourceOf(element),
      this.visibleArea(element, viewportHeight),
    );
  }

  private visibleArea(element: Element, viewportHeight: number): number {
    const box = element.getBoundingClientRect();
    return this.counts(box, viewportHeight) ? box.width * box.height : notShown;
  }

  private counts(box: DOMRect, viewportHeight: number): boolean {
    return isOnScreen(box, viewportHeight) && this.isBigEnough(box);
  }

  private isBigEnough(box: DOMRect): boolean {
    return box.width >= this.minimumSide && box.height >= this.minimumSide;
  }
}
