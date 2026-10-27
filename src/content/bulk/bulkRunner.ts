import { errorMessage, isAbortError } from "../errors";
import type { FolderSource } from "../saving/folderPicker";
import type { Notifier } from "../ui/notifier";
import type { RunPanel, RunReporter } from "../ui/progressPanel";

export interface BulkJob {
  readonly title: string;
  run(
    folder: FileSystemDirectoryHandle,
    signal: AbortSignal,
    reporter: RunReporter,
  ): Promise<string>;
}

// Runs one bulk download at a time: asks for the folder while the click is
// still fresh, shows the panel with its Stop button, and reports how it ended.
export class BulkRunner {
  private running = false;

  constructor(
    private readonly folders: FolderSource,
    private readonly panel: RunPanel,
    private readonly notifier: Notifier,
  ) {}

  async run(job: BulkJob): Promise<void> {
    if (this.running) {
      this.notifier.error("A download is already running.");
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
      this.notifier.error("Could not get access to the download folder.");
      return;
    }
    const controller = new AbortController();
    this.panel.open(job.title, () => {
      controller.abort();
    });
    try {
      this.panel.finish(await job.run(folder, controller.signal, this.panel));
    } catch (error) {
      this.panel.finish(
        isAbortError(error)
          ? "Stopped. Start it again to carry on where it left off."
          : errorMessage(error),
      );
    }
  }
}
