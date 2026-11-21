import { assetNamesOf, slidesOf } from "../../src/page/mediaAssets";
import { cdn, photo } from "../fixtures";

describe("media assets", () => {
  it("lists the asset of every image and video version", () => {
    const media = {
      ...photo("1", "p.jpg"),
      video_versions: [{ url: cdn("v.mp4"), width: 1, height: 1 }],
    };
    expect(assetNamesOf(media)).toEqual(["p.jpg", "p.jpg", "v.mp4"]);
    expect(assetNamesOf({ pk: "1" })).toEqual([]);
  });

  it("skips lists and sizes that are not what Instagram usually sends", () => {
    expect(
      assetNamesOf({
        pk: "1",
        image_versions2: { candidates: [7, { url: 3 }, { url: cdn("a.jpg") }] },
        video_versions: null,
      }),
    ).toEqual(["a.jpg"]);
    expect(assetNamesOf({ pk: "1", image_versions2: null })).toEqual([]);
  });

  it("lists the media and each slide with an id", () => {
    const media = {
      pk: "1",
      carousel_media: [{ pk: "2" }, { id: "x" }, 4],
    };
    expect(slidesOf(media)).toEqual([media, { pk: "2" }]);
    const single = { pk: "1", carousel_media: null };
    expect(slidesOf(single)).toEqual([single]);
  });
});
