// Entry point for the content script, which runs in the extension's own world.
import type { ContentEnvironment } from "./startContent";
import { startContent } from "./startContent";

startContent({
  window: window as ContentEnvironment["window"],
  storage: chrome.storage.local,
});
