import { errorMessage } from "../errorText";
import { isAbortError } from "../errors";
import type { FolderSource } from "../saving/folderPicker";
import type { Notifier } from "../ui/notifier";
import type { RunPanel, RunReporter } from "../ui/progressPanel";

const text = {
  alreadyRunning: "A download is already running.",
  noFolder: "Could not get access to the download folder.",
  stopped: "Stopped. Start it again to carry on where it left off.",
} as const;

export interface BulkJob {
  readonly title: string;
  run(
    folder: FileSystemDirectoryHandle,
    signal: AbortSignal,
    reporter: RunReporter,
  ): Promise<string>;
}

export interface JobRunner {
  run(job: BulkJob): Promise<void>;
}

// Runs one bulk download at a time: asks for the folder while the click is
// still fresh, shows the panel with its Stop button, and reports how it ended.
export class BulkRunner implements JobRunner {
  private running = false;

  constructor(
    private readonly folders: FolderSource,
    private readonly panel: RunPanel,
    private readonly notifier: Notifier,
    private readonly controllerClass: new () => AbortController,
  ) {}

  async run(job: BulkJob): Promise<void> {
    if (this.running) {
      this.notifier.error(text.alreadyRunning);
      return;
    }
    this.running = true;
    try {
      await this.runWithFolder(job);
    } finally {
      this.running = false;
    }
  }

  private async runWithFolder(job: BulkJob): Promise<void> {
    let folder: FileSystemDirectoryHandle;
    try {
      folder = await this.folders.pick();
    } catch {
      this.notifier.error(text.noFolder);
      return;
    }
    const controller = new this.controllerClass();
    this.panel.open(job.title, () => {
      controller.abort();
    });
    try {
      this.panel.finish(await job.run(folder, controller.signal, this.panel));
    } catch (error) {
      this.panel.finish(
        isAbortError(error) ? text.stopped : errorMessage(error),
      );
    }
  }
}
