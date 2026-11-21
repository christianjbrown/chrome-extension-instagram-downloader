// The post, story or slide a picture on screen belongs to.
import type { ProcedureOutput } from "../bridge";
import type { MediaCheck } from "../checks";
import type { InstagramMedia } from "../media";

export const MEDIA_BY_ASSET_PROCEDURE = "mediaByAsset";

declare module "../bridge" {
  interface Procedures {
    mediaByAsset: { input: { asset: string }; output: InstagramMedia };
  }
}

export class MediaByAssetOutput implements ProcedureOutput<
  typeof MEDIA_BY_ASSET_PROCEDURE
> {
  readonly name = MEDIA_BY_ASSET_PROCEDURE;

  constructor(private readonly check: MediaCheck) {}

  parse(value: unknown): InstagramMedia {
    return this.check.media(value);
  }
}
