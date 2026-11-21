// Wires up the page script. Runs at document_start in Instagram's own world.
import { pageOrigin } from "../shared/origin";
import { BoundedMap } from "./boundedMap";
import { BridgeServer } from "./bridgeServer";
import { whenParsed } from "./documentReady";
import { scanEmbeddedJson } from "./embeddedJson";
import type { PageConfig } from "./config";
import { refusalDetector } from "./refusalWiring";
import { FollowingClient } from "./followingClient";
import { FollowingPageParser } from "./followingParser";
import { FollowingPolicy } from "./followingPolicy";
import { InstagramHeaders } from "./instagramHeaders";
import { PostByIdQuery } from "./queries/postById";
import { PostsPageQuery } from "./queries/postsPage";
import { ProfileByIdQuery } from "./queries/profile";
import { MediaCache } from "./mediaCache";
import { MediaIndex } from "./mediaIndex";
import { ReelIndex } from "./reelIndex";
import { UserIndex } from "./userIndex";
import { PolarisViewerId } from "./viewerIdentity";
import { procedureTable } from "./procedureWiring";
import { RelayClient, windowRequire } from "./relayClient";
import { tapFetch, tapXhr } from "./responseTap";
import { InstagramApiPolicy } from "./urlPolicy";

type PageWindow = Window & typeof globalThis & { require?: unknown };

// The cache of what Instagram sent, one index per kind of object.
function memory({ cacheLimit }: PageConfig) {
  const store = <V>() => new BoundedMap<V>(cacheLimit);
  const media = new MediaIndex(store());
  const users = new UserIndex(store(), store());
  const reels = new ReelIndex(store());
  return { cache: new MediaCache([media, users, reels]), media, users, reels };
}

export function startPage(target: PageWindow, config: PageConfig): void {
  const { cache, media, users, reels } = memory(config);
  const ingest = (value: unknown): void => {
    cache.ingest(value);
  };
  const policy = new InstagramApiPolicy(pageOrigin);
  tapXhr(target.XMLHttpRequest.prototype, ingest, policy);
  tapFetch(target, ingest, policy);
  whenParsed(target.document, () => {
    scanEmbeddedJson(target.document, ingest);
  });
  const require = windowRequire(target);
  const relay = new RelayClient(require);
  const procedures = procedureTable(
    {
      media,
      users,
      reels,
      viewer: new PolarisViewerId(require),
      mediaQuery: new PostByIdQuery(relay),
      postsQuery: new PostsPageQuery(relay, config.postsPageSize),
      profileQuery: new ProfileByIdQuery(relay),
      following: new FollowingClient(
        new InstagramHeaders(require),
        (url, init) => target.fetch(url, init),
        { path: config.followingPath, pageSize: config.followingPageSize },
        { policy: new FollowingPolicy(), parser: new FollowingPageParser() },
      ),
    },
    config.inputLimits,
  );
  new BridgeServer(
    procedures,
    { origin: pageOrigin, source: target },
    refusalDetector(),
  ).listen(target);
}
