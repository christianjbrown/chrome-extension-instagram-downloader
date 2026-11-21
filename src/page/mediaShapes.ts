// Tells the kinds of object Instagram sends apart by their shape, since
// nothing in them says what they are.
import type { InstagramMedia } from "../shared/media";

export type Json = Record<string, unknown>;

export const isObject = (value: unknown): value is Json =>
  typeof value === "object" && value !== null;

const isId = (value: unknown): boolean =>
  typeof value === "string" || typeof value === "number";

// A post or slide carries an id and at least one of these.
const pictureKeys: readonly (keyof InstagramMedia)[] = [
  "image_versions2",
  "video_versions",
  "carousel_media",
];

export function isMedia(value: Json): boolean {
  return isId(value.pk) && pictureKeys.some((key) => value[key] !== undefined);
}

export function isUser(value: Json): boolean {
  return (
    typeof value.username === "string" && (isId(value.pk) || isId(value.id))
  );
}

export function isReel(value: Json): boolean {
  return Array.isArray(value.items) && isId(value.id);
}

export function ownerOf(reel: Json): string | undefined {
  const user = reel.user;
  return isObject(user) && typeof user.username === "string"
    ? user.username
    : undefined;
}

/** Calls visit on every object inside root, root included. */
export function eachObject(root: unknown, visit: (value: Json) => void): void {
  const pending: unknown[] = [root];
  while (pending.length > 0) {
    const value = pending.pop();
    if (!isObject(value)) continue;
    visit(value);
    pending.push(...Object.values(value));
  }
}
