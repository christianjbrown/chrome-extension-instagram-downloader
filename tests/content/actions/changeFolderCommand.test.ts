import { ChangeFolderCommand } from "../../../src/content/actions/changeFolderCommand";
import { EnglishProfileWording } from "../../../src/content/actions/profileWording";
import { notifier } from "../helpers";

const folder = {} as FileSystemDirectoryHandle;

describe("ChangeFolderCommand", () => {
  it("always shows the chooser", async () => {
    const folders = { pick: vi.fn(() => Promise.resolve(folder)) };
    await new ChangeFolderCommand(
      folders,
      notifier(),
      new EnglishProfileWording(),
    ).run();
    expect(folders.pick).toHaveBeenCalledWith(true);
  });

  it("says so when the folder was not changed", async () => {
    const notes = notifier();
    await new ChangeFolderCommand(
      { pick: () => Promise.reject(new Error("x")) },
      notes,
      new EnglishProfileWording(),
    ).run();
    expect(notes.error).toHaveBeenCalledWith(
      "The download folder was not changed.",
    );
  });
});
