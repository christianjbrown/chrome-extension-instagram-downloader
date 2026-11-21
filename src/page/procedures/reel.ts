// A reel of stories by its id, from what Instagram already sent only.
import type { Input, Reel } from "../../shared/bridge";
import { isRecord } from "../../shared/json";
import { REEL_PROCEDURE } from "../../shared/procedures/reel";
import type { FieldCheck, PageProcedure, ReelLookup } from "../ports";
import { loadedReel, settle } from "./lookup";

type Name = typeof REEL_PROCEDURE.name;

export class ReelProcedure implements PageProcedure<Name> {
  readonly name = REEL_PROCEDURE.name;

  constructor(
    private readonly reels: ReelLookup,
    private readonly reelId: FieldCheck,
  ) {}

  isInput(input: unknown): input is Input<Name> {
    return isRecord(input) && this.reelId.accepts(input.reelId);
  }

  handle({ reelId }: Input<Name>): Promise<Reel> {
    return settle(() => loadedReel(this.reels, reelId));
  }
}
