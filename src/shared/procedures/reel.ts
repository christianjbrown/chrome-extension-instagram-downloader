// A reel of stories, by the reel's id.
import type { ProcedureOutput, Reel } from "../bridge";
import type { ReelCheck } from "../checks";

export const REEL_PROCEDURE = "reel";

declare module "../bridge" {
  interface Procedures {
    reel: { input: { reelId: string }; output: Reel };
  }
}

export class ReelOutput implements ProcedureOutput<typeof REEL_PROCEDURE> {
  readonly name = REEL_PROCEDURE;

  constructor(private readonly check: ReelCheck) {}

  parse(value: unknown): Reel {
    return this.check.reel(value);
  }
}
