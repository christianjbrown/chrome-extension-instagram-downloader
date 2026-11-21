// Asks for a new download folder, whether or not one is chosen already.
import type { FolderSource } from "../saving/ports";
import type { Notifier } from "../ui/ports";
import type { Command, FolderWording } from "./ports";

export class ChangeFolderCommand implements Command {
  constructor(
    private readonly folders: FolderSource,
    private readonly notifier: Notifier,
    private readonly wording: FolderWording,
  ) {}

  async run(): Promise<void> {
    try {
      await this.folders.pick(true);
    } catch {
      this.notifier.error(this.wording.folderUnchanged());
    }
  }
}
