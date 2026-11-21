// The checks for answers that carry media. Every address is held to the
// media host policy it is given, so a reply can never point a download at
// another site.
import type { Reel } from "./bridge";
import type {
  AddressCheck,
  MediaCheck,
  MediaUrlPolicy,
  PostListCheck,
  ReadablePosts,
  ReelCheck,
} from "./checks";
import { isJsonObject } from "./json";
import type { InstagramMedia, MediaVersion } from "./media";
import { count, list, optional, record, reject, text } from "./schemas";

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

export class MediaSchema
  implements AddressCheck, MediaCheck, PostListCheck, ReelCheck
{
  constructor(private readonly isMediaUrl: MediaUrlPolicy) {}

  mediaUrl(value: unknown): string {
    const url = text(value, "address");
    return this.isMediaUrl(url) ? url : reject("address");
  }

  // Optional fields are left out rather than set to undefined, as Instagram
  // does.
  media(value: unknown): InstagramMedia {
    const raw = record(value, "post");
    const id = optional(raw.id, (v) => text(v, "post"));
    const takenAt = optional(raw.taken_at, (v) => count(v, "post"));
    const images = optional(raw.image_versions2, (v) => this.candidates(v));
    const videos = optional(raw.video_versions, (v) => this.versions(v));
    const slides = optional(raw.carousel_media, (v) =>
      list(v, (slide) => this.media(slide), "list of slides"),
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

  // One odd post should not cost the rest of its page, so a post that fails
  // its check is counted and left out instead of rejecting the lot.
  readablePosts(value: unknown): ReadablePosts {
    const raw: unknown[] = Array.isArray(value)
      ? (value as unknown[])
      : reject("list of posts");
    const items: InstagramMedia[] = [];
    for (const entry of raw) {
      try {
        items.push(this.media(entry));
      } catch {
        // Counted below.
      }
    }
    return { items, unreadable: raw.length - items.length };
  }

  // Stories, whether asked for by reel or by account.
  reel(value: unknown): Reel {
    const raw = record(value, "story");
    return {
      owner: optional(raw.owner, (v) => text(v, "story")),
      items: list(raw.items, (v) => this.media(v), "list of posts"),
    };
  }

  private version(value: unknown): MediaVersion {
    const raw = record(value, "picture size");
    return {
      url: this.mediaUrl(raw.url),
      width: count(raw.width, "picture size"),
      height: count(raw.height, "picture size"),
    };
  }

  private versions(value: unknown): MediaVersion[] {
    return list(value, (v) => this.version(v), "list of picture sizes");
  }

  private candidates(value: unknown): { candidates: MediaVersion[] } {
    return {
      candidates: this.versions(record(value, "image list").candidates),
    };
  }
}
