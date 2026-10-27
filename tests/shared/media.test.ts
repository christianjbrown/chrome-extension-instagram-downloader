import {
  assetName,
  assetNames,
  bestUrl,
  downloadItems,
  fileExtension,
  fileName,
  largestVersion,
} from "../../src/shared/media";
import { cdn, photo } from "../fixtures";

describe("largestVersion", () => {
  it("is undefined for no versions", () => {
    expect(largestVersion([])).toBeUndefined();
  });

  it("picks the version with the largest area", () => {
    const small = { url: "a", width: 10, height: 10 };
    const big = { url: "b", width: 20, height: 20 };
    expect(largestVersion([small, big, small])).toBe(big);
  });
});

describe("bestUrl", () => {
  it("prefers video over the cover image", () => {
    const media = {
      ...photo("1"),
      video_versions: [{ url: "v.mp4", width: 1, height: 1 }],
    };
    expect(bestUrl(media)).toBe("v.mp4");
  });

  it("falls back to the largest image", () => {
    expect(bestUrl(photo("1", "x.jpg"))).toBe(cdn("x.jpg", 1080));
  });

  it("is undefined when there is nothing to download", () => {
    expect(bestUrl({ pk: "1" })).toBeUndefined();
  });
});

describe("downloadItems", () => {
  it("gives one item for a single post", () => {
    expect(downloadItems(photo("7", "a.jpg"))).toEqual([
      { id: "7_1", username: "alice", takenAt: 1700000000, url: cdn("a.jpg") },
    ]);
  });

  it("gives one item per carousel slide, borrowing the post's details", () => {
    const slide = {
      pk: 9,
      image_versions2: { candidates: [{ url: "s.jpg", width: 1, height: 1 }] },
    };
    const empty = { pk: 10 };
    const media = { ...photo("8"), carousel_media: [slide, empty] };
    expect(downloadItems(media)).toEqual([
      { id: "9", username: "alice", takenAt: 1700000000, url: "s.jpg" },
    ]);
  });

  it("uses the fallback username and time when the media has none", () => {
    const media = {
      pk: "3",
      image_versions2: { candidates: [{ url: "x.jpg", width: 1, height: 1 }] },
    };
    expect(downloadItems(media, "bob")).toEqual([
      { id: "3", username: "bob", takenAt: 0, url: "x.jpg" },
    ]);
    expect(downloadItems(media)[0]?.username).toBe("unknown");
  });
});

describe("file names", () => {
  it("takes the extension from the URL path", () => {
    expect(fileExtension("https://x.com/a/b.mp4?x=.jpg")).toBe("mp4");
    expect(fileExtension("https://x.com/a/b")).toBe("jpg");
  });

  it("joins username, time and id, without characters a file system refuses", () => {
    const item = {
      id: "1_2",
      username: "a:b",
      takenAt: 5,
      url: "https://x.com/f.webp",
    };
    expect(fileName(item)).toBe("ab_5_1_2.webp");
  });
});

describe("asset names", () => {
  it("is the last path segment of absolute and relative URLs", () => {
    expect(assetName(cdn("pic.jpg"))).toBe("pic.jpg");
    expect(assetName("/media/pic.jpg?x=1")).toBe("pic.jpg");
  });

  it("lists the asset of every image and video version", () => {
    const media = {
      ...photo("1", "p.jpg"),
      video_versions: [{ url: cdn("v.mp4"), width: 1, height: 1 }],
    };
    expect(assetNames(media)).toEqual(["p.jpg", "p.jpg", "v.mp4"]);
    expect(assetNames({ pk: "1" })).toEqual([]);
  });
});
