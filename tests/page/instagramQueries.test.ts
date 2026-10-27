import { InstagramQueries } from "../../src/page/instagramQueries";
import type { RelayClient } from "../../src/page/relayClient";
import { photo } from "../fixtures";

function queries(data: unknown, modules: Record<string, unknown> = {}) {
  const relay = {
    query: vi.fn((name: string, member?: string) => ({
      params: `${name}.${member ?? ""}`,
    })),
    run: vi.fn(() => Promise.resolve(data)),
  };
  return {
    relay,
    queries: new InstagramQueries(
      relay as unknown as RelayClient,
      (name) => modules[name],
    ),
  };
}

describe("InstagramQueries", () => {
  it("reads the signed-in account id", () => {
    const { queries: q } = queries(
      {},
      { PolarisConfig: { getViewerId: () => 42 } },
    );
    expect(q.viewerId()).toBe("42");
  });

  it("loads a post by id", async () => {
    const media = photo("5");
    const { relay, queries: q } = queries({
      xdt_api__v1__media__media_id_web_info: { items: [media] },
    });
    await expect(q.mediaById("5")).resolves.toBe(media);
    expect(relay.query).toHaveBeenCalledWith(
      "PolarisPostActionLoadPostQuery",
      "POST_QUERY_MEDIA_ID",
    );
    expect(relay.run).toHaveBeenCalledWith(expect.anything(), { mediaId: "5" });
  });

  it("fails clearly when a post response has an unexpected shape", async () => {
    await expect(
      queries({
        xdt_api__v1__media__media_id_web_info: { items: [] },
      }).queries.mediaById("1"),
    ).rejects.toThrow("Post not found");
    await expect(
      queries({
        xdt_api__v1__media__media_id_web_info: { items: "x" },
      }).queries.mediaById("1"),
    ).rejects.toThrow("Unexpected response");
    await expect(
      queries({ xdt_api__v1__media__media_id_web_info: 3 }).queries.mediaById(
        "1",
      ),
    ).rejects.toThrow("Unexpected response at items");
  });

  it("pages through an account's posts", async () => {
    const node = photo("1");
    const connection = (pageInfo: unknown) => ({
      xdt_api__v1__feed__user_timeline_graphql_connection: {
        edges: [{ node }],
        page_info: pageInfo,
      },
    });
    const more = queries(connection({ has_next_page: true, end_cursor: "c2" }));
    await expect(more.queries.postsPage("alice", "c1")).resolves.toEqual({
      items: [node],
      cursor: "c2",
    });
    expect(more.relay.run).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ after: "c1", username: "alice" }),
    );
    const last = queries(
      connection({ has_next_page: false, end_cursor: "c3" }),
    );
    await expect(last.queries.postsPage("alice", undefined)).resolves.toEqual({
      items: [node],
      cursor: undefined,
    });
    expect(last.relay.run).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ after: null }),
    );
    const odd = queries(connection({ has_next_page: true, end_cursor: 7 }));
    await expect(
      odd.queries.postsPage("alice", undefined),
    ).resolves.toMatchObject({ cursor: undefined });
  });

  it("reads an account's profile", async () => {
    const hd = queries({
      user: {
        username: "a",
        hd_profile_pic_url_info: { url: "hd.jpg" },
        media_count: 3,
      },
    });
    await expect(hd.queries.profile("1")).resolves.toEqual({
      username: "a",
      profilePicUrl: "hd.jpg",
      totalPosts: 3,
    });
    const plain = queries({
      user: { username: "a", profile_pic_url: "sd.jpg" },
    });
    await expect(plain.queries.profile("1")).resolves.toEqual({
      username: "a",
      profilePicUrl: "sd.jpg",
      totalPosts: 0,
    });
    const none = queries({ user: { username: "a" } });
    await expect(none.queries.profile("1")).resolves.toMatchObject({
      profilePicUrl: undefined,
    });
  });

  it("fails when the profile is missing", async () => {
    await expect(queries({ user: null }).queries.profile("1")).rejects.toThrow(
      "Account not found",
    );
    await expect(
      queries({ user: { username: 5 } }).queries.profile("1"),
    ).rejects.toThrow("Account not found");
  });
});
