import { MediaCache } from "../../src/page/mediaCache";
import { createProcedures } from "../../src/page/procedures";
import { photo } from "../fixtures";

function setup() {
  const cache = new MediaCache(100);
  const queries = {
    viewerId: vi.fn(() => "1"),
    profile: vi.fn(() =>
      Promise.resolve({
        username: "me",
        profilePicUrl: "p.jpg",
        totalPosts: 2,
      }),
    ),
    mediaById: vi.fn((id: string) => Promise.resolve(photo(id))),
    postsPage: vi.fn(() =>
      Promise.resolve({
        items: [photo("1", "x.jpg", "other"), photo("2", "y.jpg", "alice")],
        cursor: undefined,
      }),
    ),
  };
  const following = {
    page: vi.fn(() => Promise.resolve({ usernames: ["a"], next: undefined })),
  };
  const procedures = createProcedures({
    cache,
    queries: queries,
    following: following,
  });
  return { cache, queries, following, procedures };
}

describe("page procedures", () => {
  it("identifies the signed-in account", async () => {
    const { procedures } = setup();
    await expect(procedures.viewer({})).resolves.toEqual({
      id: "1",
      username: "me",
    });
  });

  it("answers media from the cache before asking Instagram", async () => {
    const { cache, queries, procedures } = setup();
    cache.ingest(photo("5"));
    await expect(procedures.media({ mediaId: "5" })).resolves.toMatchObject({
      pk: "5",
    });
    expect(queries.mediaById).not.toHaveBeenCalled();
    await expect(procedures.media({ mediaId: "6" })).resolves.toMatchObject({
      pk: "6",
    });
  });

  it("matches pictures on screen from the cache only", async () => {
    const { cache, procedures } = setup();
    cache.ingest(photo("5", "five.jpg"));
    await expect(
      procedures.mediaByAsset({ asset: "five.jpg" }),
    ).resolves.toMatchObject({ pk: "5" });
    await expect(
      procedures.mediaByAsset({ asset: "nope.jpg" }),
    ).rejects.toThrow("That picture has not loaded yet");
  });

  it("passes post pages and following pages through", async () => {
    const { cache, procedures, queries, following } = setup();
    await expect(
      procedures.postsPage({ username: "a", cursor: "c" }),
    ).resolves.not.toHaveProperty("total");
    expect(queries.postsPage).toHaveBeenCalledWith("a", "c");
    cache.ingest({ username: "a", pk: "3", media_count: 12 });
    await expect(
      procedures.postsPage({ username: "a", cursor: undefined }),
    ).resolves.toMatchObject({ total: 12 });
    await procedures.followingPage({ userId: "1", next: "n" });
    expect(following.page).toHaveBeenCalledWith("1", "n");
  });

  it("finds an account's id in the cache, or from its own posts", async () => {
    const { cache, queries, procedures } = setup();
    cache.ingest({ username: "cached", pk: "8" });
    await expect(
      procedures.account({ username: "cached" }),
    ).resolves.toMatchObject({ id: "8", username: "me" });
    await expect(
      procedures.account({ username: "alice" }),
    ).resolves.toMatchObject({ id: "1" });
    expect(queries.profile).toHaveBeenLastCalledWith("1");
    await expect(procedures.account({ username: "nobody" })).rejects.toThrow(
      "Could not find nobody",
    );
  });

  it("returns stories that have loaded", async () => {
    const { cache, procedures } = setup();
    cache.ingest({
      id: "77",
      user: { username: "carol", pk: "77" },
      items: [photo("9")],
    });
    await expect(procedures.reel({ reelId: "77" })).resolves.toMatchObject({
      owner: "carol",
    });
    await expect(
      procedures.userReel({ username: "carol" }),
    ).resolves.toMatchObject({ owner: "carol" });
    await expect(procedures.reel({ reelId: "1" })).rejects.toThrow(
      "This story has not loaded yet",
    );
    await expect(procedures.userReel({ username: "dave" })).rejects.toThrow(
      "This story has not loaded yet",
    );
  });
});
