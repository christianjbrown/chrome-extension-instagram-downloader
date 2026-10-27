// Remembers the chosen download folder. A folder handle can only be kept in
// IndexedDB, not in extension storage.

export interface FolderStore {
  get(): Promise<FileSystemDirectoryHandle | undefined>;
  set(folder: FileSystemDirectoryHandle): Promise<void>;
}

const databaseName = "instagram-downloader-extension";
const storeName = "settings";
const folderKey = "download-folder";

function request<T>(operation: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    operation.onsuccess = () => {
      resolve(operation.result);
    };
    operation.onerror = () => {
      reject(operation.error ?? new Error("IndexedDB request failed"));
    };
  });
}

const isDirectory = (value: unknown): value is FileSystemDirectoryHandle =>
  typeof value === "object" &&
  value !== null &&
  (value as { kind?: unknown }).kind === "directory";

export class IndexedDbFolderStore implements FolderStore {
  constructor(private readonly factory: IDBFactory) {}

  private async open(): Promise<IDBDatabase> {
    const opening = this.factory.open(databaseName, 1);
    opening.onupgradeneeded = () => {
      opening.result.createObjectStore(storeName);
    };
    return request(opening);
  }

  private async store(mode: IDBTransactionMode): Promise<IDBObjectStore> {
    const database = await this.open();
    return database.transaction(storeName, mode).objectStore(storeName);
  }

  async get(): Promise<FileSystemDirectoryHandle | undefined> {
    const store = await this.store("readonly");
    const value: unknown = await request(store.get(folderKey));
    return isDirectory(value) ? value : undefined;
  }

  async set(folder: FileSystemDirectoryHandle): Promise<void> {
    const store = await this.store("readwrite");
    await request(store.put(folder, folderKey));
  }
}
