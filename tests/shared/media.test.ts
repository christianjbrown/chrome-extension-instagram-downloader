import { assetName, assetNames } from "../../src/shared/media";
import { cdn, photo } from "../fixtures";

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
