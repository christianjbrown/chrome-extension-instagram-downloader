// What the procedures answered from memory share: a lookup that may find
// nothing, run so that a miss rejects instead of throwing.
import type { PageReel, ReelLookup } from "../ports";

const storyNotLoaded = "This story has not loaded yet";

// Runs a lookup that may throw, as a promise that rejects instead.
export const settle = <T>(lookup: () => T): Promise<T> =>
  Promise.resolve().then(lookup);

export function found<T>(value: T | undefined, message: string): T {
  if (value === undefined) throw new Error(message);
  return value;
}

export function loadedReel(
  reels: ReelLookup,
  reelId: string | undefined,
): PageReel {
  return found(
    reelId === undefined ? undefined : reels.reel(reelId),
    storyNotLoaded,
  );
}
