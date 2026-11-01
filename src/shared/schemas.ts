// Checks what the page script sent back before the content script uses it.
// Any script on the page can answer a request, so every reply is treated as
// untrusted input and rejected when it does not have the expected shape.
import type { Output, ProcedureName } from "./bridge";
import type { InstagramMedia, MediaVersion } from "./media";
import { isMediaUrl } from "./mediaUrl";

type Parser<T> = (value: unknown) => T;
type Json = Record<string, unknown>;

function reject(what: string): never {
  throw new Error(`The page sent an unexpected ${what}`);
}

const record = (value: unknown, what: string): Json =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Json)
    : reject(what);

const text = (value: unknown, what: string): string =>
  typeof value === "string" ? value : reject(what);

const count = (value: unknown, what: string): number =>
  typeof value === "number" && Number.isFinite(value) ? value : reject(what);

const optional = <T>(value: unknown, parse: Parser<T>): T | undefined =>
  value === undefined ? undefined : parse(value);

const list = <T>(value: unknown, parse: Parser<T>, what: string): T[] =>
  Array.isArray(value) ? (value as unknown[]).map(parse) : reject(what);

const mediaUrl = (value: unknown): string => {
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

const identifier = (value: unknown): string | number =>
  typeof value === "string" || typeof value === "number"
    ? value
    : reject("identifier");

function user(value: unknown): NonNullable<InstagramMedia["user"]> {
  const raw = record(value, "user");
  const pk = optional(raw.pk, identifier);
  return {
    username: text(raw.username, "user"),
    ...(pk === undefined ? {} : { pk }),
  };
}

function candidates(value: unknown): { candidates: MediaVersion[] } {
  return { candidates: versions(record(value, "image list").candidates) };
}

// Optional fields are left out rather than set to undefined, as Instagram does.
function media(value: unknown): InstagramMedia {
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
function readablePosts(value: unknown): {
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

const outputs: { [N in ProcedureName]: Parser<Output<N>> } = {
  viewer: (value) => {
    const raw = record(value, "viewer");
    return {
      id: text(raw.id, "viewer"),
      username: text(raw.username, "viewer"),
    };
  },
  media,
  mediaByAsset: media,
  postsPage: (value) => {
    const raw = record(value, "page of posts");
    const { items, unreadable } = readablePosts(raw.items);
    return {
      items,
      cursor: optional(raw.cursor, (v) => text(v, "cursor")),
      ...(unreadable === 0 ? {} : { unreadable }),
    };
  },
  account: (value) => {
    const raw = record(value, "account");
    return {
      id: text(raw.id, "account"),
      username: text(raw.username, "account"),
      profilePicUrl: optional(raw.profilePicUrl, mediaUrl),
      totalPosts: count(raw.totalPosts, "account"),
    };
  },
  followingPage: (value) => {
    const raw = record(value, "page of accounts");
    return {
      usernames: list(
        raw.usernames,
        (v) => text(v, "username"),
        "list of usernames",
      ),
      next: optional(raw.next, (v) => text(v, "cursor")),
    };
  },
  reel: reelOf,
  userReel: reelOf,
};

function reelOf(value: unknown): Output<"reel"> {
  const raw = record(value, "story");
  return {
    owner: optional(raw.owner, (v) => text(v, "story")),
    items: mediaList(raw.items),
  };
}

export function parseOutput<N extends ProcedureName>(
  name: N,
  value: unknown,
): Output<N> {
  return outputs[name](value);
}
