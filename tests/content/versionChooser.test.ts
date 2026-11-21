import { LargestVersionChooser } from "../../src/content/versionChooser";
import { cdn, photo } from "../fixtures";

const chooser = new LargestVersionChooser();

describe("LargestVersionChooser", () => {
  it("picks the version with the largest area", () => {
    const small = { url: "a", width: 10, height: 10 };
    const big = { url: "b", width: 20, height: 20 };
    const media = {
      pk: "1",
      image_versions2: { candidates: [small, big, small] },
    };
    expect(chooser.url(media)).toBe("b");
  });

  it("prefers video over the cover image", () => {
    const media = {
      ...photo("1"),
      video_versions: [{ url: "v.mp4", width: 1, height: 1 }],
    };
    expect(chooser.url(media)).toBe("v.mp4");
  });

  it("falls back to the largest image", () => {
    expect(chooser.url(photo("1", "x.jpg"))).toBe(cdn("x.jpg", 1080));
  });

  it("is undefined when there is nothing to download", () => {
    expect(chooser.url({ pk: "1" })).toBeUndefined();
  });
});
