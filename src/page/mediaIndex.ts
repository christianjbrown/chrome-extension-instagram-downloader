import type { JsonObject } from "../shared/json";
import { assetNames, type InstagramMedia } from "../shared/media";
import { isMedia } from "./mediaShapes";
import type { IterableStore, MediaLookup, Rememberer } from "./ports";

const slidesOf = (media: InstagramMedia): readonly InstagramMedia[] => [
  media,
  ...(media.carousel_media ?? []),
];

// Every post and slide Instagram has sent, by id.
export class MediaIndex implements Rememberer, MediaLookup {
  constructor(private readonly media: IterableStore<InstagramMedia>) {}

  remember(value: JsonObject): void {
    if (isMedia(value)) this.media.set(String(value.pk), value);
  }

  mediaById(pk: string): InstagramMedia | undefined {
    return this.media.get(pk);
  }

  // Each post is tried before its slides, and older posts before newer.
  mediaByAsset(asset: string): InstagramMedia | undefined {
    return Array.from(this.media.values(), slidesOf)
      .flat()
      .find((slide) => assetNames(slide).includes(asset));
  }
}
