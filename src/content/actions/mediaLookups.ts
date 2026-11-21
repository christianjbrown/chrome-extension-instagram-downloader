// The ways a post or story is found through the page, one per key it can
// be found by.
import type { InstagramMedia } from "../../shared/media";
import type { Bridge } from "../ports";
import type { MediaKeys, MediaLookup } from "./ports";

// By its media id, as a post's address or a story's address names it.
export class MediaIdLookup implements MediaLookup {
  constructor(private readonly bridge: Bridge) {}

  key(target: MediaKeys): string | undefined {
    return target.mediaId;
  }

  find(mediaId: string): Promise<InstagramMedia> {
    return this.bridge.call("media", { mediaId });
  }
}

// By the picture or video on screen, when nothing names the media.
export class AssetLookup implements MediaLookup {
  constructor(private readonly bridge: Bridge) {}

  key(target: MediaKeys): string | undefined {
    return target.asset;
  }

  find(asset: string): Promise<InstagramMedia> {
    return this.bridge.call("mediaByAsset", { asset });
  }
}
