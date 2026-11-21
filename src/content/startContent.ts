// Builds the content script's object graph, with the features and bulk
// downloads built by their own wiring modules. Only these modules construct
// classes; everything else receives what it needs.
import { PageBridge } from "./bridgeClient";
import { PageScanner } from "./features/pageScanner";
import type { ContentConfig } from "./config";
import { LegacyFolderDatabase } from "./saving/legacyFolderDatabase";
import { pageOrigin } from "../shared/origin";
import { ValidatedBridge } from "./validatedBridge";
import { TimeoutScheduler } from "./scheduler";
import { ToastNotifier } from "./ui/notifier";
import type { Bridge, Scheduler } from "./ports";
import { DomButtons } from "./ui/buttons";
import { SlideFiles } from "./mediaFiles";
import { LargestVersionChooser } from "./versionChooser";

import { features } from "./featureWiring";
import type { ContentEnvironment } from "./wiring";

function pageBridge(
  env: ContentEnvironment,
  config: ContentConfig,
  scheduler: Scheduler,
): Bridge {
  return new ValidatedBridge(
    new PageBridge(
      (message, origin, transfer) => {
        env.window.postMessage(message, origin, transfer);
      },
      {
        pageOrigin,
        newChannel: () => new env.window.MessageChannel(),
        scheduler,
        timeoutMs: config.bridgeTimeoutMs,
      },
    ),
  );
}

export function startContent(
  env: ContentEnvironment,
  config: ContentConfig,
): void {
  const { document } = env.window;
  new LegacyFolderDatabase(env.window.indexedDB).remove();
  const scheduler = new TimeoutScheduler(env.window);
  const notifier = new ToastNotifier(
    document,
    scheduler,
    config.toastLifetimeMs,
  );
  const bridge = pageBridge(env, config, scheduler);
  const buttons = new DomButtons(document);
  const files = new SlideFiles(new LargestVersionChooser());
  const wiring = {
    env,
    config,
    scheduler,
    bridge,
    notifier,
    buttons,
    files,
  };
  new PageScanner(features(wiring), scheduler, config.scanDelayMs).start(
    document.body,
    (callback) => new env.window.MutationObserver(callback),
  );
}
