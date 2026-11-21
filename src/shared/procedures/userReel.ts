// An account's current stories, by its username.
import type { ProcedureOutput } from "../bridge";
import { reel } from "../schemas";

declare module "../bridge" {
  interface Procedures {
    userReel: { input: { username: string }; output: Reel };
  }
}

export const USER_REEL_PROCEDURE = {
  name: "userReel",
  parse: reel,
} as const satisfies ProcedureOutput<"userReel">;
