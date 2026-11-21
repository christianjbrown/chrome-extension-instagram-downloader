import { entriesOf, isJsonObject, type JsonObject } from "../shared/json";
import { isMedia, isReel, ownerOf } from "./mediaShapes";
import type { KeyedStore, PageReel, ReelLookup, Rememberer } from "./ports";

// Every story reel and highlight Instagram has sent, by id.
export class ReelIndex implements Rememberer, ReelLookup {
  constructor(private readonly reels: KeyedStore<PageReel>) {}

  remember(value: JsonObject): void {
    if (!isReel(value)) return;
    const items = entriesOf(value.items).filter(isJsonObject).filter(isMedia);
    const reel: PageReel = { owner: ownerOf(value), items };
    this.reels.set(String(value.id), reel);
  }

  reel(reelId: string): PageReel | undefined {
    return this.reels.get(reelId);
  }
}
