// What the features ask of the page's own elements.

/** Finds the picture on screen that stands for a post, slide or story. */
export interface AssetFinder {
  largest(container: ParentNode): string | undefined;
}
