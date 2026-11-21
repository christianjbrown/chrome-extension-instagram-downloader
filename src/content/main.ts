// Entry point for the content script, which runs in the extension's own world.
import { CONTENT_CONFIG } from "./config";
import { startContent } from "./startContent";
import type { ContentEnvironment } from "./wiring";

startContent(
  {
    window: window as ContentEnvironment["window"],
    storage: chrome.storage.local,
  },
  CONTENT_CONFIG,
);
