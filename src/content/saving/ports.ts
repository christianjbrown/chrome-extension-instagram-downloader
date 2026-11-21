// The ways files are saved, as the rest of the content script sees them.
import type { DownloadItem } from "../../shared/media";

/** What came of writing one file, by name. */
export const OUTCOME = {
  saved: "saved",
  skipped: "skipped",
  failed: "failed",
} as const;

export type WriteOutcome = (typeof OUTCOME)[keyof typeof OUTCOME];

export const WRITE_OUTCOMES: readonly WriteOutcome[] = Object.values(OUTCOME);

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
