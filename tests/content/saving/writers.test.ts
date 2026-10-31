import { DirectoryWriter } from "../../../src/content/saving/directoryWriter";
import { blobFetcher } from "../../../src/content/saving/fetchBlob";
import { FileDownloader } from "../../../src/content/saving/fileDownloader";
import { MemoryFolder, asFolder } from "../helpers";

const item = {
  id: "1_2",
  username: "alice",
  takenAt: 5,
  url: "https://cdn.example/a.jpg",
};

describe("blobFetcher", () => {
  it("returns the body of a successful response", async () => {
    const fetch = blobFetcher(
      () => Promise.resolve(new Response("data")),
      () => true,
    );
    await expect((await fetch("u")).text()).resolves.toBe("data");
  });

  it("fails on an error status", async () => {
    const fetch = blobFetcher(
      () => Promise.resolve(new Response("", { status: 403 })),
      () => true,
    );
    await expect(fetch("u")).rejects.toThrow("Download failed (403)");
  });
});

describe("blobFetcher policy", () => {
  it("refuses an address the policy rejects without fetching it", async () => {
    const fetchFn = vi.fn(() => Promise.resolve(new Response("data")));
    const fetch = blobFetcher(fetchFn, () => false);
    await expect(fetch("https://evil.example/a.jpg")).rejects.toThrow(
      "Refusing to download",
    );
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

describe("DirectoryWriter", () => {
  it("writes a new file, then skips it", async () => {
    const folder = new MemoryFolder();
    const writer = new DirectoryWriter(() => Promise.resolve(new Blob(["x"])));
    await expect(writer.exists(asFolder(folder), item)).resolves.toBe(false);
    await expect(writer.write(asFolder(folder), item)).resolves.toBe("saved");
    await expect(writer.write(asFolder(folder), item)).resolves.toBe("skipped");
    expect(folder.files.get("alice_5_1_2.jpg")?.size).toBe(1);
  });

  it("asking whether a file exists creates nothing", async () => {
    const folder = new MemoryFolder();
    const writer = new DirectoryWriter(() => Promise.resolve(new Blob(["x"])));
    await expect(writer.exists(asFolder(folder), item)).resolves.toBe(false);
    expect(folder.files.size).toBe(0);
  });

  it("passes on errors other than a missing file", async () => {
    const writer = new DirectoryWriter(() => Promise.resolve(new Blob(["x"])));
    for (const error of [
      new DOMException("no", "NotAllowedError"),
      new Error("boom"),
    ]) {
      const folder = {
        getFileHandle: () => Promise.reject(error),
      } as unknown as FileSystemDirectoryHandle;
      await expect(writer.exists(folder, item)).rejects.toBe(error);
    }
  });

  it("leaves nothing behind for a failed file so it is tried again", async () => {
    const folder = new MemoryFolder();
    const writer = new DirectoryWriter(() => Promise.reject(new Error("403")));
    await expect(writer.write(asFolder(folder), item)).resolves.toBe("failed");
    expect(folder.files.has("alice_5_1_2.jpg")).toBe(false);
    await expect(writer.exists(asFolder(folder), item)).resolves.toBe(false);
  });
});

describe("FileDownloader", () => {
  it("downloads through a temporary link and releases it", async () => {
    const urls = {
      createObjectURL: vi.fn(() => "blob:1"),
      revokeObjectURL: vi.fn(),
    };
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    await new FileDownloader(
      document,
      () => Promise.resolve(new Blob(["x"])),
      urls,
    ).download(item);
    const link = click.mock.contexts[0] as HTMLAnchorElement;
    expect(link.download).toBe("alice_5_1_2.jpg");
    expect(link.href).toBe("blob:1");
    expect(urls.revokeObjectURL).toHaveBeenCalledWith("blob:1");
  });
});
