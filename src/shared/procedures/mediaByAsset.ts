// The post, story or slide a picture on screen belongs to.
import type { ProcedureOutput } from "../bridge";
import type { InstagramMedia } from "../media";
import { media } from "../schemas";

declare module "../bridge" {
  interface Procedures {
    mediaByAsset: { input: { asset: string }; output: InstagramMedia };
  }
}

export const MEDIA_BY_ASSET_PROCEDURE = {
  name: "mediaByAsset",
  parse: media,
} as const satisfies ProcedureOutput<"mediaByAsset">;
