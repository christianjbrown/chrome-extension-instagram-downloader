// An account's current stories, by its username.
import type { ProcedureOutput, Reel } from "../bridge";
import type { ReelCheck } from "../checks";

export const USER_REEL_PROCEDURE = "userReel";

declare module "../bridge" {
  interface Procedures {
    userReel: { input: { username: string }; output: Reel };
  }
}

export class UserReelOutput implements ProcedureOutput<
  typeof USER_REEL_PROCEDURE
> {
  readonly name = USER_REEL_PROCEDURE;

  constructor(private readonly check: ReelCheck) {}

  parse(value: unknown): Reel {
    return this.check.reel(value);
  }
}
