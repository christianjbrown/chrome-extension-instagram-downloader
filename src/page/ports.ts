// What the parts of the page script depend on, apart from how any of them is
// built. Each concrete class implements one or more of these.
import type { Reel } from "../shared/bridge";
import type { JsonObject } from "../shared/json";
import type { InstagramMedia } from "../shared/media";

/** Somewhere to remember values by key. */
export interface KeyedStore<V> {
  get(key: string): V | undefined;
  set(key: string, value: V): void;
  values(): MapIterator<V>;
}

/** Takes in whatever Instagram sent the page. */
export interface MediaSink {
  ingest(root: unknown): void;
}

/** Remembers one kind of object Instagram sends, and ignores every other. */
export interface Rememberer {
  remember(value: JsonObject): void;
}

/** The posts, stories and slides remembered so far. */
export interface MediaLookup {
  mediaById(pk: string): InstagramMedia | undefined;
  /** The media, or the carousel slide, a picture on screen belongs to. */
  mediaByAsset(asset: string): InstagramMedia | undefined;
}

/** The accounts remembered so far. */
export interface UserLookup {
  userId(username: string): string | undefined;
  postCount(username: string): number | undefined;
}

/** The story reels remembered so far. */
export interface ReelLookup {
  reel(reelId: string): Reel | undefined;
}
