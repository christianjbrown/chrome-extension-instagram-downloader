// The ways files are saved, as the rest of the content script sees them.
import type { DownloadItem } from "../../shared/media";

/** What came of writing one file, by name. */
export const OUTCOME = {
  saved: "saved",
  skipped: "skipped",
  failed: "failed",
} as const;

export type WriteOutcome = (typeof OUTCOME)[keyof typeof OUTCOME];

export interface ItemWriter {
  exists(
    folder: FileSystemDirectoryHandle,
    item: DownloadItem,
  ): Promise<boolean>;
  write(
    folder: FileSystemDirectoryHandle,
    item: DownloadItem,
  ): Promise<WriteOutcome>;
}

export type FetchBlob = (url: string) => Promise<Blob>;

export interface ItemDownloader {
  download(item: DownloadItem): Promise<void>;
}

export interface FileNamer {
  nameFor(item: DownloadItem): string;
}

export interface FolderSource {
  pick(chooseAgain?: boolean): Promise<FileSystemDirectoryHandle>;
}

export interface FolderStore {
  get(): Promise<FileSystemDirectoryHandle | undefined>;
  set(folder: FileSystemDirectoryHandle): Promise<void>;
}

/** What the folder chooser is opened with. */
export interface PickerOptions {
  readonly id: string;
  readonly mode: "readwrite";
  readonly startIn: "downloads";
}

/** Opens a folder chooser and hands back the folder picked. */
export interface DirectoryChooser {
  show(options: PickerOptions): Promise<FileSystemDirectoryHandle>;
}
