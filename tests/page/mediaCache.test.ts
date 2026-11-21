import { photo } from "../fixtures";
import { memory } from "./memory";

describe("MediaCache", () => {
  it("finds media, users and story reels anywhere in a response", () => {
    const m = memory(100);
    const story = photo("50", "story.jpg", "carol");
    m.cache.ingest({
      data: {
        feed: [photo("10", "a.jpg"), null, "text", 4],
        owner: { username: "alice", pk: "1" },
        profile: { username: "dave", pk: "4", media_count: 640 },
        byId: { username: "bob", id: 2 },
        reels_media: [
          {
            id: "77",
            user: { username: "carol", pk: 77 },
            items: [story, "x", { pk: "no-media" }],
          },
        ],
        anonymousReel: { id: 5, items: [], user: "not an object" },
        nameless: { id: 6, items: [], user: { pk: 1 } },
      },
    });

    expect(m.media.mediaById("10")?.id).toBe("10_1");
    expect(m.users.userId("alice")).toBe("1");
    expect(m.users.userId("bob")).toBe("2");
    expect(m.users.postCount("dave")).toBe(640);
    expect(m.users.postCount("alice")).toBeUndefined();
    expect(m.users.userId("carol")).toBe("77");
    expect(m.reels.reel("77")).toEqual({ owner: "carol", items: [story] });
    expect(m.reels.reel("5")).toEqual({ owner: undefined, items: [] });
    expect(m.reels.reel("6")?.owner).toBeUndefined();
  });

  it("ignores objects that only look like media", () => {
    const m = memory(100);
    m.cache.ingest({ pk: { nested: true }, image_versions2: {} });
    m.cache.ingest({ pk: "1" });
    expect(m.media.mediaById("1")).toBeUndefined();
  });

  it("recognises numeric ids and every kind of media", () => {
    const m = memory(100);
    m.cache.ingest([
      { pk: 3, video_versions: [] },
      { pk: "4", carousel_media: [] },
    ]);
    expect(m.media.mediaById("3")).toBeDefined();
    expect(m.media.mediaById("4")).toBeDefined();
  });

  it("matches a picture on screen to its media or carousel slide", () => {
    const m = memory(100);
    const slide = photo("21", "slide.jpg");
    m.cache.ingest({ ...photo("20", "cover.jpg"), carousel_media: [slide] });
    expect(m.media.mediaByAsset("cover.jpg")?.pk).toBe("20");
    expect(m.media.mediaByAsset("slide.jpg")).toEqual(slide);
    expect(m.media.mediaByAsset("other.jpg")).toBeUndefined();
  });

  it("answers undefined for things it has not seen", () => {
    const m = memory(100);
    expect(m.users.userId("nobody")).toBeUndefined();
    expect(m.reels.reel("1")).toBeUndefined();
  });

  it("forgets the oldest entries past its limit", () => {
    const m = memory(2);
    for (const id of ["1", "2", "1", "3"]) m.cache.ingest(photo(id));
    expect(m.media.mediaById("2")).toBeUndefined();
    expect(m.media.mediaById("1")).toBeDefined();
    expect(m.media.mediaById("3")).toBeDefined();
    for (const [id, n] of [
      ["a", "1"],
      ["b", "2"],
      ["c", "3"],
    ] as const)
      m.cache.ingest({ id, items: [], user: { username: `u${n}`, pk: n } });
    expect(m.reels.reel("a")).toBeUndefined();
    expect(m.reels.reel("c")).toBeDefined();
    expect(m.users.userId("u1")).toBeUndefined();
    expect(m.users.userId("u3")).toBe("3");
  });
});
