// Wires up the page script. Runs at document_start in Instagram's own world.
import { pageOrigin } from "../shared/bridge";
import { BridgeServer } from "./bridgeServer";
import { FollowingClient } from "./followingClient";
import { InstagramQueries } from "./instagramQueries";
import { MediaCache } from "./mediaCache";
import { createProcedures } from "./procedures";
import { RelayClient, windowRequire } from "./relayClient";
import { parseResponse, tapFetch, tapXhr } from "./responseTap";

// Instagram embeds the data for the first screen in the HTML itself.
export function scanEmbeddedJson(
  document: Document,
  sink: (value: unknown) => void,
): void {
  for (const script of document.querySelectorAll(
    'script[type="application/json"]',
  )) {
    for (const value of parseResponse(script.textContent)) sink(value);
  }
}

type PageWindow = Window & typeof globalThis & { require?: unknown };

export function startPage(target: PageWindow): void {
  const cache = new MediaCache();
  const ingest = (value: unknown): void => {
    cache.ingest(value);
  };
  tapXhr(target.XMLHttpRequest.prototype, ingest);
  tapFetch(target, ingest);
  const scan = (): void => {
    scanEmbeddedJson(target.document, ingest);
  };
  if (target.document.readyState === "loading")
    target.document.addEventListener("DOMContentLoaded", scan);
  else scan();
  const require = windowRequire(target);
  const procedures = createProcedures({
    cache,
    queries: new InstagramQueries(new RelayClient(require), require),
    following: new FollowingClient(require, (url, init) =>
      target.fetch(url, init),
    ),
  });
  new BridgeServer(procedures, pageOrigin, target).listen(target);
}
