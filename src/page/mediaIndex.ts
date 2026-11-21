import type { JsonObject } from "../shared/json";
import { assetNames, type InstagramMedia } from "../shared/media";
import { isMedia } from "./mediaShapes";
import type { KeyedStore, MediaLookup, Rememberer } from "./ports";

// Every post and slide Instagram has sent, by id.
export class MediaIndex implements Rememberer, MediaLookup {
  constructor(private readonly media: KeyedStore<InstagramMedia>) {}

  remember(value: JsonObject): void {
    if (!isMedia(value)) return;
    const media = value as unknown as InstagramMedia;
    this.media.set(String(media.pk), media);
  }

  mediaById(pk: string): InstagramMedia | undefined {
    return this.media.get(pk);
  }

  mediaByAsset(asset: string): InstagramMedia | undefined {
    for (const media of this.media.values()) {
      const slides = [media, ...(media.carousel_media ?? [])];
      const match = slides.find((slide) => assetNames(slide).includes(asset));
      if (match !== undefined) return match;
    }
    return undefined;
  }
}
