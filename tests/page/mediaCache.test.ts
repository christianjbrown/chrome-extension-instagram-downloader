import { BoundedMap } from "../../src/page/boundedMap";
import { MediaCache } from "../../src/page/mediaCache";
import { photo } from "../fixtures";

describe("MediaCache", () => {
  it("finds media, users and story reels anywhere in a response", () => {
    const cache = new MediaCache(<V>() => new BoundedMap<V>(100));
    const story = photo("50", "story.jpg", "carol");
    cache.ingest({
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

    expect(cache.mediaById("10")?.id).toBe("10_1");
    expect(cache.userId("alice")).toBe("1");
    expect(cache.userId("bob")).toBe("2");
    expect(cache.postCount("dave")).toBe(640);
    expect(cache.postCount("alice")).toBeUndefined();
    expect(cache.userId("carol")).toBe("77");
    expect(cache.reel("77")).toEqual({ owner: "carol", items: [story] });
    expect(cache.reel("5")).toEqual({ owner: undefined, items: [] });
    expect(cache.reel("6")?.owner).toBeUndefined();
  });

  it("ignores objects that only look like media", () => {
    const cache = new MediaCache(<V>() => new BoundedMap<V>(100));
    cache.ingest({ pk: { nested: true }, image_versions2: {} });
    cache.ingest({ pk: "1" });
    expect(cache.mediaById("1")).toBeUndefined();
  });

  it("recognises numeric ids and every kind of media", () => {
    const cache = new MediaCache(<V>() => new BoundedMap<V>(100));
    cache.ingest([
      { pk: 3, video_versions: [] },
      { pk: "4", carousel_media: [] },
    ]);
    expect(cache.mediaById("3")).toBeDefined();
    expect(cache.mediaById("4")).toBeDefined();
  });

  it("matches a picture on screen to its media or carousel slide", () => {
    const cache = new MediaCache(<V>() => new BoundedMap<V>(100));
    const slide = photo("21", "slide.jpg");
    cache.ingest({ ...photo("20", "cover.jpg"), carousel_media: [slide] });
    expect(cache.mediaByAsset("cover.jpg")?.pk).toBe("20");
    expect(cache.mediaByAsset("slide.jpg")).toEqual(slide);
    expect(cache.mediaByAsset("other.jpg")).toBeUndefined();
  });

  it("answers undefined for things it has not seen", () => {
    const cache = new MediaCache(<V>() => new BoundedMap<V>(100));
    expect(cache.userId("nobody")).toBeUndefined();
    expect(cache.reel("1")).toBeUndefined();
  });

  it("forgets the oldest entries past its limit", () => {
    const cache = new MediaCache(<V>() => new BoundedMap<V>(2));
    for (const id of ["1", "2", "1", "3"]) cache.ingest(photo(id));
    expect(cache.mediaById("2")).toBeUndefined();
    expect(cache.mediaById("1")).toBeDefined();
    expect(cache.mediaById("3")).toBeDefined();
    for (const [id, n] of [
      ["a", "1"],
      ["b", "2"],
      ["c", "3"],
    ] as const)
      cache.ingest({ id, items: [], user: { username: `u${n}`, pk: n } });
    expect(cache.reel("a")).toBeUndefined();
    expect(cache.reel("c")).toBeDefined();
    expect(cache.userId("u1")).toBeUndefined();
    expect(cache.userId("u3")).toBe("3");
  });
});
