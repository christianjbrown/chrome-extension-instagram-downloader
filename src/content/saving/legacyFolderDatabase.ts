const databaseName = "instagram-downloader-extension";

// Earlier versions kept the folder handle in IndexedDB on Instagram's origin.
// Deleting a database that is not there does nothing, so this is safe to run
// every time the content script starts.
export class LegacyFolderDatabase {
  constructor(private readonly factory: Pick<IDBFactory, "deleteDatabase">) {}

  remove(): void {
    this.factory.deleteDatabase(databaseName);
  }
}
