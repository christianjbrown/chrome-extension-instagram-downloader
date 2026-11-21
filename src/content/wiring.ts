// What every part of the content script's object graph is built from.
import type { KeyValueArea } from "./bulk/runStore";
import type { MediaUrlPolicy } from "../shared/checks";
import type { ContentConfig } from "./config";
import type { ShowDirectoryPicker } from "./saving/folderPicker";
import type { Bridge, ErrorDescriber, MediaFiles, Scheduler } from "./ports";
import type { IconButtons, Notifier, TextButtons } from "./ui/ports";

export interface ContentEnvironment {
  readonly window: Window &
    typeof globalThis & { showDirectoryPicker: ShowDirectoryPicker };
  readonly storage: KeyValueArea;
}

// What every part of the graph is built from.
export interface Wiring {
  readonly env: ContentEnvironment;
  readonly config: ContentConfig;
  readonly scheduler: Scheduler;
  readonly bridge: Bridge;
  readonly notifier: Notifier;
  readonly buttons: IconButtons & TextButtons;
  readonly files: MediaFiles;
  /** Which addresses media may be fetched from. */
  readonly mediaUrls: MediaUrlPolicy;
  readonly errors: ErrorDescriber;
}
