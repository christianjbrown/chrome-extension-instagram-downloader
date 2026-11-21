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

  async pick(chooseAgain?: boolean): Promise<FileSystemDirectoryHandle> {
    return (await this.remembered(chooseAgain)) ?? this.choose();
  }

  private remembered(
    chooseAgain: boolean | undefined,
  ): Promise<FileSystemDirectoryHandle | undefined> {
    return chooseAgain === true
      ? Promise.resolve(undefined)
      : this.permittedStored();
  }

  private async permittedStored(): Promise<
    FileSystemDirectoryHandle | undefined
  > {
    const stored = await this.store.get();
    return stored === undefined ? undefined : this.ifPermitted(stored);
  }

  private async ifPermitted(
    stored: FileSystemDirectoryHandle,
  ): Promise<FileSystemDirectoryHandle | undefined> {
    return (await this.permitted(stored)) ? stored : undefined;
  }

  private async choose(): Promise<FileSystemDirectoryHandle> {
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
