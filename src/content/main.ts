// Entry point for the content script, which runs in the extension's own world.
import { CONTENT_CONFIG } from "./config";
import { startContent } from "./startContent";

startContent(
  {
    window,
    storage: chrome.storage.local,
  },
  CONTENT_CONFIG,
);
