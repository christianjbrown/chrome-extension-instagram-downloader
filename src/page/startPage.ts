// Wires up the page script. Runs at document_start in Instagram's own world.
import { pageOrigin } from "../shared/origin";
import { BridgeServer } from "./bridgeServer";
import { scanEmbeddedJson } from "./embeddedJson";
import type { PageConfig } from "./config";
import { ProcedureInputs } from "./procedureInputs";
import { InstagramRefusalDetector } from "./refusalDetector";
import { FollowingClient } from "./followingClient";
import { InstagramHeaders } from "./instagramHeaders";
import { InstagramQueries } from "./instagramQueries";
import { MediaCache } from "./mediaCache";
import { createProcedures } from "./procedures";
import { RelayClient, windowRequire } from "./relayClient";
import { InstagramApiPolicy, tapFetch, tapXhr } from "./responseTap";

type PageWindow = Window & typeof globalThis & { require?: unknown };

export function startPage(target: PageWindow, config: PageConfig): void {
  const cache = new MediaCache(config.cacheLimit);
  const ingest = (value: unknown): void => {
    cache.ingest(value);
  };
  const policy = new InstagramApiPolicy(pageOrigin);
  tapXhr(target.XMLHttpRequest.prototype, ingest, policy);
  tapFetch(target, ingest, policy);
  const scan = (): void => {
    scanEmbeddedJson(target.document, ingest);
  };
  if (target.document.readyState === "loading")
    target.document.addEventListener("DOMContentLoaded", scan);
  else scan();
  const require = windowRequire(target);
  const procedures = createProcedures({
    cache,
    queries: new InstagramQueries(
      new RelayClient(require),
      require,
      config.postsPageSize,
    ),
    following: new FollowingClient(
      new InstagramHeaders(require),
      (url, init) => target.fetch(url, init),
      { path: config.followingPath, pageSize: config.followingPageSize },
    ),
  });
  new BridgeServer(
    procedures,
    { origin: pageOrigin, source: target },
    new InstagramRefusalDetector(),
    new ProcedureInputs(config.inputLimits),
  ).listen(target);
}
