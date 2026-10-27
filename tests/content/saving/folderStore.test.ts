import { IDBFactory } from "fake-indexeddb";
import { IndexedDbFolderStore } from "../../../src/content/saving/folderStore";

describe("IndexedDbFolderStore", () => {
  it("remembers a folder", async () => {
    const store = new IndexedDbFolderStore(new IDBFactory());
    await expect(store.get()).resolves.toBeUndefined();
    const folder = {
      kind: "directory",
      name: "Downloads",
    } as unknown as FileSystemDirectoryHandle;
    await store.set(folder);
    await expect(store.get()).resolves.toEqual(folder);
  });

  it("ignores anything stored that is not a folder", async () => {
    const store = new IndexedDbFolderStore(new IDBFactory());
    await store.set({ kind: "file" } as unknown as FileSystemDirectoryHandle);
    await expect(store.get()).resolves.toBeUndefined();
  });

  it("reports a database that cannot be opened", async () => {
    const failing = (error: DOMException | null) =>
      ({
        open: () => {
          const request = {} as IDBOpenDBRequest & {
            error: DOMException | null;
          };
          request.error = error;
          queueMicrotask(() => {
            request.onerror?.call(request, new Event("error"));
          });
          return request;
        },
      }) as unknown as IDBFactory;
    const blocked = new DOMException("blocked");
    await expect(new IndexedDbFolderStore(failing(blocked)).get()).rejects.toBe(
      blocked,
    );
    await expect(new IndexedDbFolderStore(failing(null)).get()).rejects.toThrow(
      "IndexedDB request failed",
    );
  });
});
