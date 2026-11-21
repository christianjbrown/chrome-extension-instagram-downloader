import { isJsonObject, type JsonObject } from "../../shared/json";
import type { FolderStore, FolderSource } from "./ports";

const readwrite = { mode: "readwrite" } as const;

type Mode = typeof readwrite;

// Chrome's own permission calls on a folder, which TypeScript's DOM types do
// not describe yet. Only "granted" is acted on, so any other answer is left
// unchecked.
interface PermissionHandle {
  queryPermission(options: Mode): Promise<unknown>;
  requestPermission(options: Mode): Promise<unknown>;
}

/** What the folder chooser is opened with. */
export interface PickerOptions extends Mode {
  readonly id: string;
  readonly startIn: "downloads";
}

export type ShowDirectoryPicker = (
  options: PickerOptions,
) => Promise<FileSystemDirectoryHandle>;

const granted = "granted";

const text = {
  noPermissions: "The folder cannot be asked for access",
} as const;

const isCall = (value: unknown): boolean => typeof value === "function";

const hasPermissionCalls = ({
  queryPermission,
  requestPermission,
}: JsonObject): boolean => isCall(queryPermission) && isCall(requestPermission);

const isPermissionHandle = (value: unknown): value is PermissionHandle =>
  isJsonObject(value) && hasPermissionCalls(value);

function permissionHandle(folder: FileSystemDirectoryHandle): PermissionHandle {
  if (!isPermissionHandle(folder)) throw new Error(text.noPermissions);
  return folder;
}
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

  private permitted(folder: FileSystemDirectoryHandle): Promise<boolean> {
    return this.ask(permissionHandle(folder));
  }

  private async ask(handle: PermissionHandle): Promise<boolean> {
    if ((await handle.queryPermission(readwrite)) === granted) return true;
    return (await handle.requestPermission(readwrite)) === granted;
  }
}
