import type { ErrorDescriber } from "../ports";
import type { FolderSource } from "../saving/ports";
import type { Notifier, RunPanel } from "../ui/ports";
import type { BulkJob, JobRunner } from "./ports";

const text = {
  alreadyRunning: "A download is already running.",
  noFolder: "Could not get access to the download folder.",
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
    const folder = await this.folder();
    if (folder !== undefined) await this.runIn(job, folder);
  }

  // The folder to save into, or undefined when none was picked.
  private async folder(): Promise<FileSystemDirectoryHandle | undefined> {
    try {
      return await this.deps.folders.pick();
    } catch {
      this.deps.notifier.error(text.noFolder);
      return undefined;
    }
  }

  private async runIn(
    job: BulkJob,
    folder: FileSystemDirectoryHandle,
  ): Promise<void> {
    const controller = new this.deps.controllerClass();
    this.deps.panel.open(job.title, () => {
      controller.abort();
    });
    try {
      this.deps.panel.finish(
        await job.run(folder, controller.signal, this.deps.panel),
      );
    } catch (error) {
      this.deps.panel.finish(this.deps.errors.describe(error));
    }
  }
}
