// Checks what the content script asked for. Any script on the page can send
// the same request, so each procedure only accepts the shapes it really gets.
import type { Input, ProcedureName } from "../shared/bridge";

type Guard<T> = (input: unknown) => input is T;
type Json = Record<string, unknown>;

const isRecord = (input: unknown): input is Json =>
  typeof input === "object" && input !== null && !Array.isArray(input);

const matches = (value: unknown, pattern: RegExp): value is string =>
  typeof value === "string" && pattern.test(value);

const optionalText = (value: unknown): boolean =>
  value === undefined || (typeof value === "string" && value.length <= 2048);

const mediaId = /^[0-9_]{1,64}$/;
const username = /^[A-Za-z0-9._]{1,30}$/;
const reelId = /^[\w:.-]{1,128}$/;
const asset = /^[^/\\?#]{1,512}$/;
const userId = /^\d{1,32}$/;

const inputs: { [N in ProcedureName]: Guard<Input<N>> } = {
  viewer: (input): input is Input<"viewer"> => isRecord(input),
  media: (input): input is Input<"media"> =>
    isRecord(input) && matches(input.mediaId, mediaId),
  mediaByAsset: (input): input is Input<"mediaByAsset"> =>
    isRecord(input) && matches(input.asset, asset),
  postsPage: (input): input is Input<"postsPage"> =>
    isRecord(input) &&
    matches(input.username, username) &&
    optionalText(input.cursor),
  account: (input): input is Input<"account"> =>
    isRecord(input) && matches(input.username, username),
  followingPage: (input): input is Input<"followingPage"> =>
    isRecord(input) &&
    matches(input.userId, userId) &&
    optionalText(input.next),
  reel: (input): input is Input<"reel"> =>
    isRecord(input) && matches(input.reelId, reelId),
  userReel: (input): input is Input<"userReel"> =>
    isRecord(input) && matches(input.username, username),
};

export const isProcedureName = (name: string): name is ProcedureName =>
  Object.hasOwn(inputs, name);

export function isValidInput(name: ProcedureName, input: unknown): boolean {
  return inputs[name](input);
}
