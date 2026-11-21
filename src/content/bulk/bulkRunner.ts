import { isAbortError } from "../errors";
import type { ErrorDescriber } from "../ports";
import type { FolderSource } from "../saving/ports";
import type { Notifier, RunPanel } from "../ui/ports";
import type { BulkJob, JobRunner } from "./ports";

const text = {
  alreadyRunning: "A download is already running.",
  noFolder: "Could not get access to the download folder.",
  stopped: "Stopped. Start it again to carry on where it left off.",
} as const;

export interface BulkRunnerDependencies {
  readonly folders: FolderSource;
  readonly panel: RunPanel;
  readonly notifier: Notifier;
  readonly controllerClass: new () => AbortController;
  readonly errors: ErrorDescriber;
}

// Runs one bulk download at a time: asks for the folder while the click is
// still fresh, shows the panel with its Stop button, and reports how it ended.
export class BulkRunner implements JobRunner {
  private running = false;

  constructor(private readonly deps: BulkRunnerDependencies) {}

  async run(job: BulkJob): Promise<void> {
    if (this.running) {
      this.deps.notifier.error(text.alreadyRunning);
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
      folder = await this.deps.folders.pick();
    } catch {
      this.deps.notifier.error(text.noFolder);
      return;
    }
    const controller = new this.deps.controllerClass();
    this.deps.panel.open(job.title, () => {
      controller.abort();
    });
    try {
      this.deps.panel.finish(
        await job.run(folder, controller.signal, this.deps.panel),
      );
    } catch (error) {
      this.deps.panel.finish(
        isAbortError(error) ? text.stopped : this.deps.errors.describe(error),
      );
    }
  }
}
