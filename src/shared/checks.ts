// The checks a procedure's answer can ask for when it carries media. Each
// procedure takes only the check it needs, built in the entry point with
// the media host policy.
import type { Reel } from "./bridge";
import type { InstagramMedia } from "./media";

/** Whether an address is one Instagram serves pictures and videos from. */
export type MediaUrlPolicy = (url: string) => boolean;

/** Checks a picture or video address against the media host policy. */
export interface AddressCheck {
  mediaUrl(value: unknown): string;
}

/** Checks one post, story or slide. */
export interface MediaCheck {
  media(value: unknown): InstagramMedia;
}

/** A page's posts that passed their check, and how many did not. */
export interface ReadablePosts {
  readonly items: InstagramMedia[];
  readonly unreadable: number;
}

/** Checks a page of posts, leaving out any that fail. */
export interface PostListCheck {
  readablePosts(value: unknown): ReadablePosts;
}

/** Checks a reel of stories. */
export interface ReelCheck {
  reel(value: unknown): Reel;
}

/** Every media check, as the entry point hands them to the procedures. */
export type MediaChecks = AddressCheck & MediaCheck & PostListCheck & ReelCheck;
