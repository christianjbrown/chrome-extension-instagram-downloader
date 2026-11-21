import type { Reel } from "../shared/bridge";
import { isJsonObject, type JsonObject } from "../shared/json";
import { isMedia, isReel, ownerOf } from "./mediaShapes";
import type { KeyedStore, ReelLookup, Rememberer } from "./ports";

// Every story reel and highlight Instagram has sent, by id.
export class ReelIndex implements Rememberer, ReelLookup {
  constructor(private readonly reels: KeyedStore<Reel>) {}

  remember(value: JsonObject): void {
    if (!isReel(value)) return;
    const items = (value.items as unknown[])
      .filter(isJsonObject)
      .filter(isMedia);
    const reel: Reel = { owner: ownerOf(value), items };
    this.reels.set(String(value.id), reel);
  }

  reel(reelId: string): Reel | undefined {
    return this.reels.get(reelId);
  }
}
