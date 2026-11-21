import { SlideFiles } from "../../src/content/mediaFiles";
import { LargestVersionChooser } from "../../src/content/versionChooser";
import { cdn, photo } from "../fixtures";

const files = new SlideFiles(new LargestVersionChooser());

describe("SlideFiles", () => {
  it("gives one item for a single post", () => {
    expect(files.items(photo("7", "a.jpg"))).toEqual([
      { id: "7_1", username: "alice", takenAt: 1700000000, url: cdn("a.jpg") },
    ]);
  });

  it("marks video items so they get a video extension", () => {
    const media = {
      ...photo("2"),
      video_versions: [
        { url: "https://x.cdninstagram.com/v", width: 1, height: 1 },
      ],
    };
    expect(files.items(media)[0]?.video).toBe(true);
  });

  it("gives one item per carousel slide, borrowing the post's details", () => {
    const slide = {
      pk: 9,
      image_versions2: { candidates: [{ url: "s.jpg", width: 1, height: 1 }] },
    };
    const empty = { pk: 10 };
    const media = { ...photo("8"), carousel_media: [slide, empty] };
    expect(files.items(media)).toEqual([
      { id: "9", username: "alice", takenAt: 1700000000, url: "s.jpg" },
    ]);
  });

  it("uses the fallback username and time when the media has none", () => {
    const media = {
      pk: "3",
      image_versions2: { candidates: [{ url: "x.jpg", width: 1, height: 1 }] },
    };
    expect(files.items(media, "bob")).toEqual([
      { id: "3", username: "bob", takenAt: 0, url: "x.jpg" },
    ]);
    expect(files.items(media)[0]?.username).toBe("unknown");
  });
});
