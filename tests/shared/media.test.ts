import {
  assetName,
  assetNames,
  bestUrl,
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
