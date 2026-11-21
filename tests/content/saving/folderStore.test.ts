import { IDBFactory } from "fake-indexeddb";
import { MemoryFolderStore } from "../../../src/content/saving/folderStore";
import { LegacyFolderDatabase } from "../../../src/content/saving/legacyFolderDatabase";

describe("MemoryFolderStore", () => {
  it("remembers a folder until the page goes away", async () => {
    const store = new MemoryFolderStore();
    await expect(store.get()).resolves.toBeUndefined();
    const folder = {
      kind: "directory",
      name: "Downloads",
    } as unknown as FileSystemDirectoryHandle;
    await store.set(folder);
    await expect(store.get()).resolves.toBe(folder);
    await expect(new MemoryFolderStore().get()).resolves.toBeUndefined();
  });
});

describe("LegacyFolderDatabase", () => {
  it("deletes the database earlier versions stored the folder in", async () => {
    const factory = new IDBFactory();
    const opening = factory.open("instagram-downloader-extension", 1);
    await new Promise((resolve) => {
      opening.onsuccess = resolve;
    });
    opening.result.close();
    new LegacyFolderDatabase(factory).run();
    await vi.waitFor(async () => {
      const names = (await factory.databases()).map((d) => d.name);
      expect(names).not.toContain("instagram-downloader-extension");
    });
  });

  it("does nothing when there is no such database", () => {
    const factory = { deleteDatabase: vi.fn() };
    new LegacyFolderDatabase(factory).run();
    expect(factory.deleteDatabase).toHaveBeenCalledWith(
      "instagram-downloader-extension",
    );
  });
});
