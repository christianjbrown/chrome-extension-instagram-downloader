import type { InstagramMedia } from "../../shared/media";
import type { MediaFinder, MediaKeys, MediaLookup } from "./ports";

// Tries each lookup in order, and the first whose key the target carries
// finds it. A new way of finding media is a new lookup in the list.
export class FirstKeyFinder implements MediaFinder {
  constructor(private readonly lookups: readonly MediaLookup[]) {}

  find(target: MediaKeys): Promise<InstagramMedia> | undefined {
    return this.lookups.reduce<Promise<InstagramMedia> | undefined>(
      (found, lookup) => found ?? this.tryLookup(lookup, target),
      undefined,
    );
  }

  private tryLookup(
    lookup: MediaLookup,
    target: MediaKeys,
  ): Promise<InstagramMedia> | undefined {
    const key = lookup.key(target);
    return key === undefined ? undefined : lookup.find(key);
  }
}
