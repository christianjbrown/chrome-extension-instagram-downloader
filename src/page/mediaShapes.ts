// Tells the kinds of object Instagram sends apart by their shape, since
// nothing in them says what they are.
import { isJsonObject, isRecord, type JsonObject } from "../shared/json";
import type { InstagramMedia } from "../shared/media";

const isId = (value: unknown): boolean =>
  typeof value === "string" || typeof value === "number";

// A post or slide carries an id and at least one of these.
const pictureKeys: readonly (keyof InstagramMedia)[] = [
  "image_versions2",
  "video_versions",
  "carousel_media",
];

/**
 * An object with the id every post, story and slide carries. The content
 * script checks the rest of its shape before it uses any of it.
 */
export const isMediaRecord = (
  value: unknown,
): value is InstagramMedia & JsonObject => isRecord(value) && isId(value.pk);

const hasPicture = (value: JsonObject): boolean =>
  pictureKeys.some((key) => value[key] !== undefined);

/** A post or slide, told apart from the other objects Instagram sends. */
export const isMedia = (
  value: JsonObject,
): value is InstagramMedia & JsonObject =>
  isMediaRecord(value) && hasPicture(value);

export function isUser(value: JsonObject): boolean {
  return (
    typeof value.username === "string" && (isId(value.pk) || isId(value.id))
  );
}

export function isReel(value: JsonObject): boolean {
  return Array.isArray(value.items) && isId(value.id);
}

export function ownerOf(reel: JsonObject): string | undefined {
  const user = reel.user;
  return isJsonObject(user) && typeof user.username === "string"
    ? user.username
    : undefined;
}

/** Calls visit on every object inside root, root included. */
export function eachObject(
  root: unknown,
  visit: (value: JsonObject) => void,
): void {
  const pending: unknown[] = [root];
  while (pending.length > 0) {
    const value = pending.pop();
    if (!isJsonObject(value)) continue;
    visit(value);
    pending.push(...Object.values(value));
  }
}
