// The post, story or slide a picture on screen belongs to, from what
// Instagram already sent only.
import type { Input } from "../../shared/bridge";
import { isRecord } from "../../shared/json";
import type { InstagramMedia } from "../../shared/media";
import { MEDIA_BY_ASSET_PROCEDURE } from "../../shared/procedures/mediaByAsset";
import type { FieldCheck, MediaByAssetLookup, PageProcedure } from "../ports";
import { found, settle } from "./lookup";

type Name = typeof MEDIA_BY_ASSET_PROCEDURE.name;

const pictureNotLoaded = "That picture has not loaded yet";

export class MediaByAssetProcedure implements PageProcedure<Name> {
  readonly name = MEDIA_BY_ASSET_PROCEDURE.name;

  constructor(
    private readonly media: MediaByAssetLookup,
    private readonly asset: FieldCheck,
  ) {}

  isInput(input: unknown): input is Input<Name> {
    return isRecord(input) && this.asset.accepts(input.asset);
  }

  handle({ asset }: Input<Name>): Promise<InstagramMedia> {
    return settle(() =>
      found(this.media.mediaByAsset(asset), pictureNotLoaded),
    );
  }
}
