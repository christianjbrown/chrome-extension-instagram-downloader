import { PAGE_CONFIG } from "../../src/page/config";

describe("page config", () => {
  it("remembers two thousand of each kind of thing Instagram sends", () => {
    expect(PAGE_CONFIG.cacheLimit).toBe(2000);
  });

  it("asks for pages the size Instagram's own pages use", () => {
    expect(PAGE_CONFIG.postsPageSize).toBe(12);
    expect(PAGE_CONFIG.followingPageSize).toBe(25);
  });

  it("lists who someone follows from Instagram's own endpoint", () => {
    expect(PAGE_CONFIG.followingPath).toBe(
      "/api/v1/friendships/{userId}/following/",
    );
  });

  it("accepts request fields up to their longest real length", () => {
    expect(PAGE_CONFIG.inputLimits).toEqual({
      text: 2048,
      mediaId: 64,
      username: 30,
      reelId: 128,
      asset: 512,
      userId: 32,
    });
  });
});
