// Settings for the content script. Only its entry point reads them, and hands
// each one to the part that needs it.
import type { Pacing } from "./pacing/pacing";
import { MINUTE_MS, SECOND_MS } from "./time";

export interface ContentConfig {
  // How hard bulk downloads lean on Instagram.
  readonly pacing: Pacing;
  // How long to wait for the page script to answer before giving up.
  readonly bridgeTimeoutMs: number;
  // How long after the page changes to look for new places to add buttons.
  readonly scanDelayMs: number;
  // How long an error message stays on screen.
  readonly toastLifetimeMs: number;
  // How long to wait before asking again who is signed in, after a failure.
  readonly viewerRetryMs: number;
  // How many accounts in a row may fail before a following run stops.
  readonly failuresInARow: number;
  // Thumbnails narrower than this, in pixels, get no download button.
  readonly gridMinimumWidth: number;
  // Pictures smaller than this on either side, in pixels, are not the post.
  readonly assetMinimumSide: number;
}

export const CONTENT_CONFIG: ContentConfig = {
  pacing: {
    apiDelayMs: [4 * SECOND_MS, 9 * SECOND_MS],
    apiCallsPerHour: 600,
    fileDelayMs: [400, 1200],
    backoffMs: [
      15 * MINUTE_MS,
      30 * MINUTE_MS,
      60 * MINUTE_MS,
      120 * MINUTE_MS,
    ],
  },
  bridgeTimeoutMs: MINUTE_MS,
  scanDelayMs: 250,
  toastLifetimeMs: 6 * SECOND_MS,
  viewerRetryMs: MINUTE_MS,
  failuresInARow: 3,
  gridMinimumWidth: 100,
  assetMinimumSide: 150,
};
