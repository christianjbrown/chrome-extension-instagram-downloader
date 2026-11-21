// Checks what the content script asked for. Any script on the page can send
// the same request, so each procedure only accepts the shapes it really gets.
import type { Input, ProcedureName } from "../shared/bridge";
import { isRecord } from "../shared/json";

// The longest value each request field may hold. Any script on the page can
// send a request, so anything longer is turned away.
export interface InputLimits {
  readonly text: number;
  readonly mediaId: number;
  readonly username: number;
  readonly reelId: number;
  readonly asset: number;
  readonly userId: number;
}

export interface InputValidator {
  isProcedureName(name: string): name is ProcedureName;
  isValidInput(name: ProcedureName, input: unknown): boolean;
}

type Guard<T> = (input: unknown) => input is T;
type Guards = { [N in ProcedureName]: Guard<Input<N>> };

const matches = (value: unknown, pattern: RegExp): value is string =>
  typeof value === "string" && pattern.test(value);

// One to `limit` characters from the class, and nothing else.
const field = (characters: string, limit: number): RegExp =>
  new RegExp(`^[${characters}]{1,${String(limit)}}$`);

function guards(limits: InputLimits): Guards {
  const optionalText = (value: unknown): boolean =>
    value === undefined ||
    (typeof value === "string" && value.length <= limits.text);
  const mediaId = field("0-9_", limits.mediaId);
  const username = field("A-Za-z0-9._", limits.username);
  const reelId = field("\\w:.-", limits.reelId);
  const asset = field("^/\\\\?#", limits.asset);
  const userId = field("\\d", limits.userId);
  return {
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
}

export class ProcedureInputs implements InputValidator {
  private readonly guards: Guards;

  constructor(limits: InputLimits) {
    this.guards = guards(limits);
  }

  isProcedureName(name: string): name is ProcedureName {
    return Object.hasOwn(this.guards, name);
  }

  isValidInput(name: ProcedureName, input: unknown): boolean {
    return this.guards[name](input);
  }
}
