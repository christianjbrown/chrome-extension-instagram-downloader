// The ways files are saved, as the rest of the content script sees them.
import type { DownloadItem } from "../../shared/media";

export const WRITE_OUTCOMES = ["saved", "skipped", "failed"] as const;

export type WriteOutcome = (typeof WRITE_OUTCOMES)[number];

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
