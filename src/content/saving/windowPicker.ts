// Chrome's folder chooser on the window. TypeScript's DOM types do not
// describe it yet, so it is looked up by name, and what it hands back is
// checked to be a folder before anything uses it.
import { callMember } from "../../shared/members";
import type { PickerOptions } from "./folderPicker";

const pickerName = "showDirectoryPicker";

const text = {
  notAFolder: "The folder chooser did not give a folder",
} as const;

/** The kind of handle a chosen folder is, as the window defines it. */
export type FolderHandleType = abstract new (
  ...args: never[]
) => FileSystemDirectoryHandle;

export class WindowDirectoryPicker {
  constructor(
    private readonly target: object,
    private readonly folderType: FolderHandleType,
  ) {}

  async show(options: PickerOptions): Promise<FileSystemDirectoryHandle> {
    const chosen: unknown = await callMember(this.target, pickerName, options);
    return this.folder(chosen);
  }

  private folder(value: unknown): FileSystemDirectoryHandle {
    if (!(value instanceof this.folderType)) throw new Error(text.notAFolder);
    return value;
  }
}
