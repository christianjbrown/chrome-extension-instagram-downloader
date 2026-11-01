import { parseOutput } from "../../src/shared/schemas";
import { cdn, photo } from "../fixtures";

describe("parseOutput", () => {
  it("passes valid replies through unchanged", () => {
    const media = {
      ...photo("1"),
      video_versions: [{ url: cdn("v.mp4"), width: 2, height: 2 }],
      carousel_media: [photo("2")],
    };
    expect(parseOutput("media", media)).toEqual(media);
    expect(parseOutput("mediaByAsset", { pk: 5 })).toEqual({ pk: 5 });
    expect(parseOutput("media", { pk: 5, user: { username: "u" } })).toEqual({
      pk: 5,
      user: { username: "u" },
    });
    expect(parseOutput("viewer", { id: "1", username: "me" })).toEqual({
      id: "1",
      username: "me",
    });
    expect(
      parseOutput("postsPage", { items: [photo("1")], cursor: "c" }),
    ).toEqual({ items: [photo("1")], cursor: "c" });
    expect(parseOutput("postsPage", { items: [] })).toEqual({
      items: [],
      cursor: undefined,
    });
    const account = {
      id: "1",
      username: "a",
      profilePicUrl: cdn("p.jpg"),
      totalPosts: 3,
    };
    expect(parseOutput("account", account)).toEqual(account);
    expect(
      parseOutput("account", { ...account, profilePicUrl: undefined }),
    ).toEqual({ ...account, profilePicUrl: undefined });
    expect(
      parseOutput("followingPage", { usernames: ["a"], next: "n" }),
    ).toEqual({ usernames: ["a"], next: "n" });
    expect(parseOutput("reel", { owner: "a", items: [photo("1")] })).toEqual({
      owner: "a",
      items: [photo("1")],
    });
    expect(parseOutput("userReel", { items: [] })).toEqual({
      owner: undefined,
      items: [],
    });
  });

  it("rejects malformed replies", () => {
    const bad: [Parameters<typeof parseOutput>[0], unknown][] = [
      ["viewer", null],
      ["viewer", []],
      ["viewer", { id: 1, username: "me" }],
      ["media", { pk: {} }],
      ["media", { pk: 1, taken_at: "x" }],
      ["media", { pk: 1, taken_at: Infinity }],
      ["media", { pk: 1, user: { username: 3 } }],
      ["media", { pk: 1, carousel_media: "x" }],
      ["media", { pk: 1, image_versions2: {} }],
      ["media", { pk: 1, video_versions: [{ url: cdn("a"), width: "1" }] }],
      ["postsPage", { items: [photo("1")], cursor: 4 }],
      ["postsPage", { items: "x" }],
      ["account", { id: "1", username: "a", totalPosts: "3" }],
      ["followingPage", { usernames: [1] }],
      ["reel", { items: 4 }],
    ];
    for (const [name, value] of bad)
      expect(() => parseOutput(name, value), name).toThrow("unexpected");
  });

  it("reads a field Instagram sets to null as left out", () => {
    const fromInstagram = {
      ...photo("1"),
      id: null,
      taken_at: null,
      video_versions: null,
      carousel_media: null,
      user: { username: "u", pk: null },
    };
    const { pk, image_versions2 } = photo("1");
    const expected = { pk, image_versions2, user: { username: "u" } };
    expect(parseOutput("media", fromInstagram)).toEqual(expected);
    expect(
      parseOutput("postsPage", { items: [fromInstagram], cursor: null }),
    ).toEqual({ items: [expected], cursor: undefined });
    expect(parseOutput("media", { pk: 1, image_versions2: null })).toEqual({
      pk: 1,
    });
  });

  it("leaves out an odd post and counts it, keeping the rest of the page", () => {
    expect(
      parseOutput("postsPage", { items: [photo("1"), { pk: {} }, 7] }),
    ).toEqual({ items: [photo("1")], cursor: undefined, unreadable: 2 });
  });

  it("rejects media addresses outside Instagram's CDN", () => {
    const evil = {
      pk: 1,
      image_versions2: {
        candidates: [
          { url: "https://evil.example/a.jpg", width: 1, height: 1 },
        ],
      },
    };
    expect(() => parseOutput("media", evil)).toThrow("address");
    expect(() =>
      parseOutput("account", {
        id: "1",
        username: "a",
        // eslint-disable-next-line sonarjs/no-clear-text-protocols
        profilePicUrl: "http://x.cdninstagram.com/a.jpg",
        totalPosts: 1,
      }),
    ).toThrow("address");
    expect(() =>
      parseOutput("media", {
        pk: 1,
        image_versions2: { candidates: [{ url: 5, width: 1, height: 1 }] },
      }),
    ).toThrow("address");
  });
});
