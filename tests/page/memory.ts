import { BoundedMap } from "../../src/page/boundedMap";
import { MediaCache } from "../../src/page/mediaCache";
import { MediaIndex } from "../../src/page/mediaIndex";
import { ReelIndex } from "../../src/page/reelIndex";
import { UserIndex } from "../../src/page/userIndex";

interface Memory {
  readonly cache: MediaCache;
  readonly media: MediaIndex;
  readonly users: UserIndex;
  readonly reels: ReelIndex;
}

// The page script's cache, wired the way startPage wires it.
export function memory(limit = 100): Memory {
  const store = <V>() => new BoundedMap<V>(limit);
  const media = new MediaIndex(store());
  const users = new UserIndex(store(), store());
  const reels = new ReelIndex(store());
  return { cache: new MediaCache([media, users, reels]), media, users, reels };
}
