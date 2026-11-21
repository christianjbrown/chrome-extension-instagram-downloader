// An account's current stories by its username, from what Instagram already
// sent only.
import type { Input, Reel } from "../../shared/bridge";
import { isRecord } from "../../shared/json";
import { USER_REEL_PROCEDURE } from "../../shared/procedures/userReel";
import type {
  FieldCheck,
  PageProcedure,
  ReelLookup,
  UserIdLookup,
} from "../ports";
import { loadedReel, settle } from "./lookup";

type Name = typeof USER_REEL_PROCEDURE;

export class UserReelProcedure implements PageProcedure<Name> {
  readonly name = USER_REEL_PROCEDURE;

  constructor(
    private readonly reels: ReelLookup,
    private readonly users: UserIdLookup,
    private readonly username: FieldCheck,
  ) {}

  isInput(input: unknown): input is Input<Name> {
    return isRecord(input) && this.username.accepts(input.username);
  }

  handle({ username }: Input<Name>): Promise<Reel> {
    return settle(() => loadedReel(this.reels, this.users.userId(username)));
  }
}
