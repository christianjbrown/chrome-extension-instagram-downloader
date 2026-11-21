// Builds the content script's object graph, with the features and bulk
// downloads built by their own wiring modules. Only these modules construct
// classes; everything else receives what it needs.
import { PageBridge } from "./bridgeClient";
import { ContentStartup } from "./contentStartup";
import { PageScanner } from "./features/pageScanner";
import type { ContentConfig } from "./config";
import { LegacyFolderDatabase } from "./saving/legacyFolderDatabase";
import { pageOrigin } from "../shared/origin";
import { ValidatedBridge } from "./validatedBridge";
import { TimeoutScheduler } from "./scheduler";
import { ToastNotifier } from "./ui/notifier";
import type { Bridge, Scheduler } from "./ports";
import { DomButtons } from "./ui/buttons";
import {
  OwnMessage,
  ReloadedExtensionWording,
  WordedErrors,
} from "./errorText";
import { SlideFiles } from "./mediaFiles";
import { LargestVersionChooser } from "./versionChooser";

import { features } from "./featureWiring";
import type { ContentEnvironment } from "./wiring";
import { procedureOutputs } from "./procedureWiring";
import type { MediaUrlPolicy } from "../shared/checks";
import { MediaSchema } from "../shared/mediaSchema";
import { isMediaUrl } from "../shared/mediaUrl";

function pageBridge(
  env: ContentEnvironment,
  config: ContentConfig,
  scheduler: Scheduler,
  mediaUrls: MediaUrlPolicy,
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
    procedureOutputs(new MediaSchema(mediaUrls)),
  );
}

export function startContent(
  env: ContentEnvironment,
  config: ContentConfig,
): void {
  const { document } = env.window;
  const scheduler = new TimeoutScheduler(env.window);
  const notifier = new ToastNotifier(
    document,
    scheduler,
    config.toastLifetimeMs,
  );
  // Every media address, in an answer or a download, is held to the same
  // host policy.
  const bridge = pageBridge(env, config, scheduler, isMediaUrl);
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
    mediaUrls: isMediaUrl,
    errors: new WordedErrors(
      [new ReloadedExtensionWording()],
      new OwnMessage(),
    ),
  };
  new ContentStartup(
    [new LegacyFolderDatabase(env.window.indexedDB)],
    new PageScanner(features(wiring), scheduler, config.scanDelayMs),
  ).start(
    document.body,
    (callback) => new env.window.MutationObserver(callback),
  );
}
