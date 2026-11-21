// Tells the kinds of object Instagram sends apart by their shape, since
// nothing in them says what they are.
import {
  hasUsername,
  isJsonObject,
  isRecord,
  type JsonObject,
} from "../shared/json";
import type { PageMedia } from "./ports";

const isId = (value: unknown): boolean =>
  typeof value === "string" || typeof value === "number";

// A post or slide carries an id and at least one of these.
const pictureKeys: readonly string[] = [
  "image_versions2",
  "video_versions",
  "carousel_media",
];

/**
 * An object with the id every post, story and slide carries. The content
 * script checks the rest of its shape before it uses any of it.
 */
export const isMediaRecord = (value: unknown): value is PageMedia =>
  isRecord(value) && isId(value.pk);

const hasPicture = (value: JsonObject): boolean =>
  pictureKeys.some((key) => value[key] !== undefined);

/** A post or slide, told apart from the other objects Instagram sends. */
export const isMedia = (value: JsonObject): value is PageMedia =>
  isMediaRecord(value) && hasPicture(value);

const hasUserId = (value: JsonObject): boolean =>
  isId(value.pk) || isId(value.id);

export const isUser = (
  value: JsonObject,
): value is JsonObject & { username: string } =>
  hasUsername(value) && hasUserId(value);

export function isReel(value: JsonObject): boolean {
  return Array.isArray(value.items) && isId(value.id);
}

export function ownerOf({ user }: JsonObject): string | undefined {
  return hasUsername(user) ? user.username : undefined;
}

/** Calls visit on every object inside root, root included. */
export function eachObject(
  root: unknown,
  visit: (value: JsonObject) => void,
): void {
  const pending: unknown[] = [root];
  while (pending.length > 0) visitOne(pending.pop(), visit, pending);
}

// Visits the value when it is an object, and queues what it holds.
function visitOne(
  value: unknown,
  visit: (value: JsonObject) => void,
  pending: unknown[],
): void {
  if (!isJsonObject(value)) return;
  visit(value);
  pending.push(...Object.values(value));
}
