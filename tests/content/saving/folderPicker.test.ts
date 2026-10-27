import { FolderPicker } from "../../../src/content/saving/folderPicker";

function folder(query: string, request = "denied") {
  return {
    queryPermission: vi.fn(() => Promise.resolve(query)),
    requestPermission: vi.fn(() => Promise.resolve(request)),
  } as unknown as FileSystemDirectoryHandle;
}

function picker(stored: FileSystemDirectoryHandle | undefined) {
  const chosen = folder("granted");
  const store = {
    get: vi.fn(() => Promise.resolve(stored)),
    set: vi.fn(() => Promise.resolve()),
  };
  const show = vi.fn(() => Promise.resolve(chosen));
  return { chosen, store, show, picker: new FolderPicker(store, show) };
}

describe("FolderPicker", () => {
  it("reuses the stored folder while permission holds", async () => {
    const stored = folder("granted");
    const { picker: p, show } = picker(stored);
    await expect(p.pick()).resolves.toBe(stored);
    expect(show).not.toHaveBeenCalled();
  });

  it("asks again for permission on the stored folder", async () => {
    const stored = folder("prompt", "granted");
    await expect(picker(stored).picker.pick()).resolves.toBe(stored);
  });

  it("shows the chooser when permission is refused, nothing is stored, or asked to", async () => {
    for (const [stored, again] of [
      [folder("prompt", "denied"), false],
      [undefined, false],
      [folder("granted"), true],
    ] as const) {
      const { picker: p, show, store, chosen } = picker(stored);
      await expect(p.pick(again)).resolves.toBe(chosen);
      expect(show).toHaveBeenCalledWith({
        id: "instagram-downloader",
        mode: "readwrite",
        startIn: "downloads",
      });
      expect(store.set).toHaveBeenCalledWith(chosen);
    }
  });
});
