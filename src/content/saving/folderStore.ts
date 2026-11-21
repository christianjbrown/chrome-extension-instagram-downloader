// Holds the chosen download folder for as long as the tab lives. It is never
// written anywhere: the page's origin is Instagram's, so anything the content
// script persisted in IndexedDB could be read or replaced by Instagram's own
// scripts.
import type { FolderStore } from "./ports";

export class MemoryFolderStore implements FolderStore {
  private folder: FileSystemDirectoryHandle | undefined;

  get(): Promise<FileSystemDirectoryHandle | undefined> {
    return Promise.resolve(this.folder);
  }

  set(folder: FileSystemDirectoryHandle): Promise<void> {
    this.folder = folder;
    return Promise.resolve();
  }
}
