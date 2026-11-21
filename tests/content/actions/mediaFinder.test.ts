import { FirstKeyFinder } from "../../../src/content/actions/mediaFinder";
import {
  AssetLookup,
  MediaIdLookup,
} from "../../../src/content/actions/mediaLookups";
import { photo } from "../../fixtures";
import { fakeBridge } from "../helpers";

describe("FirstKeyFinder", () => {
  const bridge = () =>
    fakeBridge({
      media: ({ mediaId }) => photo(mediaId),
      mediaByAsset: () => photo("8"),
    });

  it("finds by id before the picture on screen", async () => {
    const page = bridge();
    const finder = new FirstKeyFinder([
      new MediaIdLookup(page),
      new AssetLookup(page),
    ]);
    await finder.find({ mediaId: "5", asset: "x.jpg" });
    expect(page.call).toHaveBeenLastCalledWith("media", { mediaId: "5" });
    await finder.find({ mediaId: undefined, asset: "x.jpg" });
    expect(page.call).toHaveBeenLastCalledWith("mediaByAsset", {
      asset: "x.jpg",
    });
  });

  it("finds nothing when no lookup reads a key the target carries", () => {
    const page = bridge();
    const finder = new FirstKeyFinder([new MediaIdLookup(page)]);
    expect(finder.find({ asset: "x.jpg" })).toBeUndefined();
    expect(page.call).not.toHaveBeenCalled();
  });
});
