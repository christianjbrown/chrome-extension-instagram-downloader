import type { InstagramMedia } from "../../shared/media";
import type { MediaFinder, MediaKeys, MediaLookup } from "./ports";

// Tries each lookup in order, and the first whose key the target carries
// finds it. A new way of finding media is a new lookup in the list.
export class FirstKeyFinder implements MediaFinder {
  constructor(private readonly lookups: readonly MediaLookup[]) {}

  find(target: MediaKeys): Promise<InstagramMedia> | undefined {
    for (const lookup of this.lookups) {
      const key = lookup.key(target);
      if (key !== undefined) return lookup.find(key);
    }
    return undefined;
  }
}
