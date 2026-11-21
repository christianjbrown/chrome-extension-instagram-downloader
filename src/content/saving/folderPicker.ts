import type { FolderStore, FolderSource } from "./ports";

type Permission = "granted" | "denied" | "prompt";

interface PermissionHandle {
  queryPermission(options: { mode: "readwrite" }): Promise<Permission>;
  requestPermission(options: { mode: "readwrite" }): Promise<Permission>;
}

export type ShowDirectoryPicker = (options: {
  id: string;
  mode: "readwrite";
  startIn: "downloads";
}) => Promise<FileSystemDirectoryHandle>;

const readwrite = { mode: "readwrite" } as const;
const granted: Permission = "granted";
// Where the picker opens the first time, before Chrome remembers a folder.
const startIn = "downloads";

// Chrome remembers where this picker was last opened, separately from others.
const pickerId = "instagram-downloader";

// Must be called straight from a click: Chrome only shows the permission
// prompt and the folder chooser while the click is recent.
export class FolderPicker implements FolderSource {
  constructor(
    private readonly store: FolderStore,
    private readonly showPicker: ShowDirectoryPicker,
  ) {}

  async pick(chooseAgain = false): Promise<FileSystemDirectoryHandle> {
    const stored = chooseAgain ? undefined : await this.store.get();
    if (stored !== undefined && (await this.permitted(stored))) return stored;
    const chosen = await this.showPicker({
      id: pickerId,
      ...readwrite,
      startIn,
    });
    await this.store.set(chosen);
    return chosen;
  }

  private async permitted(folder: FileSystemDirectoryHandle): Promise<boolean> {
    const handle = folder as unknown as PermissionHandle;
    if ((await handle.queryPermission(readwrite)) === granted) return true;
    return (await handle.requestPermission(readwrite)) === granted;
  }
}
