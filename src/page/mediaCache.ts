// Remembers every post, story and account Instagram sends the page, so most
// downloads need no extra request at all.
import type { Reel } from "../shared/bridge";
import { assetNames, type InstagramMedia } from "../shared/media";
import type { KeyedStore, StoreFactory } from "./boundedMap";
import {
  eachObject,
  isMedia,
  isObject,
  isReel,
  isUser,
  ownerOf,
  type Json,
} from "./mediaShapes";

/** Takes in whatever Instagram sent the page. */
interface MediaSink {
  ingest(root: unknown): void;
}

/** What has been remembered of what Instagram sent. */
export interface MediaLookups {
  mediaById(pk: string): InstagramMedia | undefined;
  userId(username: string): string | undefined;
  postCount(username: string): number | undefined;
  reel(reelId: string): Reel | undefined;
  mediaByAsset(asset: string): InstagramMedia | undefined;
}

export class MediaCache implements MediaSink, MediaLookups {
  private readonly media: KeyedStore<InstagramMedia>;
  private readonly users: KeyedStore<string>;
  private readonly postCounts: KeyedStore<number>;
  private readonly reels: KeyedStore<Reel>;
  // Each kind of object Instagram sends, and where it is remembered.
  private readonly rememberers: readonly ((value: Json) => void)[] = [
    (value) => {
      this.rememberMedia(value);
    },
    (value) => {
      this.rememberUser(value);
    },
    (value) => {
      this.rememberReel(value);
    },
  ];

  constructor(stores: StoreFactory) {
    this.media = stores();
    this.users = stores();
    this.postCounts = stores();
    this.reels = stores();
  }

  ingest(root: unknown): void {
    eachObject(root, (value) => {
      for (const remember of this.rememberers) remember(value);
    });
  }

  private rememberMedia(value: Json): void {
    if (!isMedia(value)) return;
    const media = value as unknown as InstagramMedia;
    this.media.set(String(media.pk), media);
  }

  private rememberUser(value: Json): void {
    if (!isUser(value)) return;
    const username = value.username as string;
    this.users.set(username, String(value.pk ?? value.id));
    // The profile page's own copy of the account carries its post count.
    if (typeof value.media_count === "number")
      this.postCounts.set(username, value.media_count);
  }

  private rememberReel(value: Json): void {
    if (!isReel(value)) return;
    const items = (value.items as unknown[]).filter(isObject).filter(isMedia);
    const reel = { owner: ownerOf(value), items } as unknown as Reel;
    this.reels.set(String(value.id), reel);
  }

  mediaById(pk: string): InstagramMedia | undefined {
    return this.media.get(pk);
  }

  userId(username: string): string | undefined {
    return this.users.get(username);
  }

  postCount(username: string): number | undefined {
    return this.postCounts.get(username);
  }

  reel(reelId: string): Reel | undefined {
    return this.reels.get(reelId);
  }

  // Finds the media, or the carousel slide, a picture on screen belongs to.
  mediaByAsset(asset: string): InstagramMedia | undefined {
    for (const media of this.media.values()) {
      const slides = [media, ...(media.carousel_media ?? [])];
      const match = slides.find((slide) => assetNames(slide).includes(asset));
      if (match !== undefined) return match;
    }
    return undefined;
  }
}
