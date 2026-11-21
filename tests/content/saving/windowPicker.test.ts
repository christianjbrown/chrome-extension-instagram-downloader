import { WindowDirectoryPicker } from "../../../src/content/saving/windowPicker";

class FakeFolder {
  readonly kind = "directory";
}

const options = {
  id: "instagram-downloader",
  mode: "readwrite",
  startIn: "downloads",
} as const;

const picker = (chosen: unknown) => {
  const window = { showDirectoryPicker: vi.fn(() => Promise.resolve(chosen)) };
  return {
    window,
    picker: new WindowDirectoryPicker(
      window,
      FakeFolder as unknown as typeof FileSystemDirectoryHandle,
    ),
  };
};

describe("WindowDirectoryPicker", () => {
  it("opens Chrome's chooser and hands back the folder chosen", async () => {
    const folder = new FakeFolder();
    const { window, picker: p } = picker(folder);
    await expect(p.show(options)).resolves.toBe(folder);
    expect(window.showDirectoryPicker).toHaveBeenCalledWith(options);
  });

  it("refuses anything that is not a folder", async () => {
    await expect(picker({}).picker.show(options)).rejects.toThrow(
      "The folder chooser did not give a folder",
    );
  });
});
