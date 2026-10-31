// Remembers every post, story and account Instagram sends the page, so most
// downloads need no extra request at all.
import type { Reel } from "../shared/bridge";
import { assetNames, type InstagramMedia } from "../shared/media";

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === "object" && value !== null;

const isId = (value: unknown): boolean =>
  typeof value === "string" || typeof value === "number";

const hasKey = (value: Json, key: string): boolean => value[key] !== undefined;

function isMedia(value: Json): boolean {
  return (
    isId(value.pk) &&
    (hasKey(value, "image_versions2") ||
      hasKey(value, "video_versions") ||
      hasKey(value, "carousel_media"))
  );
}

function isUser(value: Json): boolean {
  return (
    typeof value.username === "string" && (isId(value.pk) || isId(value.id))
  );
}

function isReel(value: Json): boolean {
  return Array.isArray(value.items) && isId(value.id);
}

function ownerOf(reel: Json): string | undefined {
  const user = reel.user;
  return isObject(user) && typeof user.username === "string"
    ? user.username
    : undefined;
}

// Remembers a value as the newest entry, forgetting the oldest past the limit.
function remember<V>(
  map: Map<string, V>,
  limit: number,
  key: string,
  value: V,
): void {
  map.delete(key);
  map.set(key, value);
  if (map.size <= limit) return;
  for (const oldest of map.keys()) {
    map.delete(oldest);
    return;
  }
}

export class MediaCache {
  private readonly media = new Map<string, InstagramMedia>();
  private readonly users = new Map<string, string>();
  private readonly reels = new Map<string, Reel>();

  constructor(private readonly limit: number) {}

  ingest(root: unknown): void {
    const pending: unknown[] = [root];
    while (pending.length > 0) {
      const value = pending.pop();
      if (!isObject(value)) continue;
      this.remember(value);
      pending.push(...Object.values(value));
    }
  }

  private remember(value: Json): void {
    if (isMedia(value)) {
      const media = value as unknown as InstagramMedia;
      remember(this.media, this.limit, String(media.pk), media);
    }
    if (isUser(value)) {
      const id = String(value.pk ?? value.id);
      remember(this.users, this.limit, value.username as string, id);
    }
    if (isReel(value)) {
      const items = (value.items as unknown[]).filter(isObject).filter(isMedia);
      const reel = { owner: ownerOf(value), items } as unknown as Reel;
      remember(this.reels, this.limit, String(value.id), reel);
    }
  }

  mediaById(pk: string): InstagramMedia | undefined {
    return this.media.get(pk);
  }

  userId(username: string): string | undefined {
    return this.users.get(username);
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
