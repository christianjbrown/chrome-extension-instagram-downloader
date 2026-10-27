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
    const fetch = blobFetcher(() => Promise.resolve(new Response("data")));
    await expect((await fetch("u")).text()).resolves.toBe("data");
  });

  it("fails on an error status", async () => {
    const fetch = blobFetcher(() =>
      Promise.resolve(new Response("", { status: 403 })),
    );
    await expect(fetch("u")).rejects.toThrow("Download failed (403)");
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

  it("leaves a failed file empty so it is tried again", async () => {
    const folder = new MemoryFolder();
    const writer = new DirectoryWriter(() => Promise.reject(new Error("403")));
    await expect(writer.write(asFolder(folder), item)).resolves.toBe("failed");
    expect(folder.files.get("alice_5_1_2.jpg")?.size).toBe(0);
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
