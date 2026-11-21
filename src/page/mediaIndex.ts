import type { JsonObject } from "../shared/json";
import { assetNamesOf, slidesOf } from "./mediaAssets";
import { isMedia } from "./mediaShapes";
import type {
  IterableStore,
  MediaLookup,
  PageMedia,
  Rememberer,
} from "./ports";

// Every post and slide Instagram has sent, by id.
export class MediaIndex implements Rememberer, MediaLookup {
  constructor(private readonly media: IterableStore<PageMedia>) {}

  remember(value: JsonObject): void {
    if (isMedia(value)) this.media.set(String(value.pk), value);
  }

  mediaById(pk: string): PageMedia | undefined {
    return this.media.get(pk);
  }

  // Each post is tried before its slides, and older posts before newer.
  mediaByAsset(asset: string): PageMedia | undefined {
    return Array.from(this.media.values(), slidesOf)
      .flat()
      .find((slide) => assetNamesOf(slide).includes(asset));
  }
}
