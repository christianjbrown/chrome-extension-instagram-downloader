// The checks every procedure's answer is built from. Any script on the page
// can answer a request, so every reply is treated as untrusted input and
// rejected when it does not have the expected shape.
import type { Reel } from "./bridge";
import type { InstagramMedia, MediaVersion } from "./media";
import { isJsonObject, isRecord, type JsonObject } from "./json";
import { isMediaUrl } from "./mediaUrl";

type Parser<T> = (value: unknown) => T;

function reject(what: string): never {
  throw new Error(`The page sent an unexpected ${what}`);
}

export const record = (value: unknown, what: string): JsonObject =>
  isRecord(value) ? value : reject(what);

export const text = (value: unknown, what: string): string =>
  typeof value === "string" ? value : reject(what);

export const count = (value: unknown, what: string): number =>
  typeof value === "number" && Number.isFinite(value) ? value : reject(what);

// Instagram marks a missing field with null as often as it leaves it out: a
// photo arrives with video_versions and carousel_media set to null.
export const optional = <T>(value: unknown, parse: Parser<T>): T | undefined =>
  value === undefined || value === null ? undefined : parse(value);

export const list = <T>(value: unknown, parse: Parser<T>, what: string): T[] =>
  Array.isArray(value) ? (value as unknown[]).map(parse) : reject(what);

export const mediaUrl = (value: unknown): string => {
  const url = text(value, "address");
  return isMediaUrl(url) ? url : reject("address");
};

function version(value: unknown): MediaVersion {
  const raw = record(value, "picture size");
  return {
    url: mediaUrl(raw.url),
    width: count(raw.width, "picture size"),
    height: count(raw.height, "picture size"),
  };
}

const versions = (value: unknown): MediaVersion[] =>
  list(value, version, "list of picture sizes");

const isIdentifier = (value: unknown): value is string | number =>
  typeof value === "string" || typeof value === "number";

const identifier = (value: unknown): string | number =>
  isIdentifier(value) ? value : reject("identifier");

// The owner only names the file. Instagram's nested owner records can leave
// the username out, so one that cannot name anybody is dropped rather than
// failing the whole post.
function user(value: unknown): InstagramMedia["user"] {
  if (!isJsonObject(value) || typeof value.username !== "string")
    return undefined;
  return {
    username: value.username,
    ...(isIdentifier(value.pk) ? { pk: value.pk } : {}),
  };
}

function candidates(value: unknown): { candidates: MediaVersion[] } {
  return { candidates: versions(record(value, "image list").candidates) };
}

// Optional fields are left out rather than set to undefined, as Instagram does.
export function media(value: unknown): InstagramMedia {
  const raw = record(value, "post");
  const id = optional(raw.id, (v) => text(v, "post"));
  const takenAt = optional(raw.taken_at, (v) => count(v, "post"));
  const images = optional(raw.image_versions2, candidates);
  const videos = optional(raw.video_versions, versions);
  const slides = optional(raw.carousel_media, (v) =>
    list(v, media, "list of slides"),
  );
  const owner = optional(raw.user, user);
  return {
    pk: identifier(raw.pk),
    ...(id === undefined ? {} : { id }),
    ...(takenAt === undefined ? {} : { taken_at: takenAt }),
    ...(images === undefined ? {} : { image_versions2: images }),
    ...(videos === undefined ? {} : { video_versions: videos }),
    ...(slides === undefined ? {} : { carousel_media: slides }),
    ...(owner === undefined ? {} : { user: owner }),
  };
}

const mediaList = (value: unknown): InstagramMedia[] =>
  list(value, media, "list of posts");

// One odd post should not cost the rest of its page, so a post that fails its
// check is counted and left out instead of rejecting the lot.
export function readablePosts(value: unknown): {
  items: InstagramMedia[];
  unreadable: number;
} {
  const raw: unknown[] = Array.isArray(value)
    ? (value as unknown[])
    : reject("list of posts");
  const items: InstagramMedia[] = [];
  for (const entry of raw) {
    try {
      items.push(media(entry));
    } catch {
      // Counted below.
    }
  }
  return { items, unreadable: raw.length - items.length };
}

// Stories, whether asked for by reel or by account.
export function reel(value: unknown): Reel {
  const raw = record(value, "story");
  return {
    owner: optional(raw.owner, (v) => text(v, "story")),
    items: mediaList(raw.items),
  };
}
