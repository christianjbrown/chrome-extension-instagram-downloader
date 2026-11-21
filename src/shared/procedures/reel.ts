// A reel of stories, by the reel's id.
import type { ProcedureOutput } from "../bridge";
import { reel } from "../schemas";

declare module "../bridge" {
  interface Procedures {
    reel: { input: { reelId: string }; output: Reel };
  }
}

export const REEL_PROCEDURE = {
  name: "reel",
  parse: reel,
} as const satisfies ProcedureOutput<"reel">;
