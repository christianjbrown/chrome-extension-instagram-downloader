import { assetName } from "../../src/shared/media";
import { cdn } from "../fixtures";

describe("asset names", () => {
  it("is the last path segment of absolute and relative URLs", () => {
    expect(assetName(cdn("pic.jpg"))).toBe("pic.jpg");
    expect(assetName("/media/pic.jpg?x=1")).toBe("pic.jpg");
  });
});
