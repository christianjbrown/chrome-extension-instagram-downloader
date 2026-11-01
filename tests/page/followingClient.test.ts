import { RefusedError } from "../../src/shared/refusal";
import { FollowingClient } from "../../src/page/followingClient";

const modules: Record<string, unknown> = {
  PolarisConfig: { getIGAppID: () => "app" },
  PolarisWWWClaim: { getWWWClaim: () => "claim" },
};

function client(status: number, body: unknown) {
  const fetch = vi.fn((_url: string, _init: RequestInit) =>
    Promise.resolve(
      typeof body === "string"
        ? new Response(body, { status })
        : new Response(JSON.stringify(body), { status }),
    ),
  );
  return { fetch, client: new FollowingClient((name) => modules[name], fetch) };
}

describe("FollowingClient", () => {
  it("refuses a user id that is not digits", async () => {
    const { fetch, client: c } = client(200, {});
    await expect(c.page("9/../x", undefined)).rejects.toThrow(
      "Invalid user id",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns usernames and the next page marker", async () => {
    const { fetch, client: c } = client(200, {
      users: [{ username: "a" }, { pk: 1 }, "x", { username: "b" }],
      next_max_id: "n2",
    });
    await expect(c.page("9", "n1")).resolves.toEqual({
      usernames: ["a", "b"],
      next: "n2",
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/friendships/9/following/?count=25&max_id=n1",
      {
        headers: { "x-ig-app-id": "app", "x-ig-www-claim": "claim" },
      },
    );
  });

  it("handles a last page and a missing user list", async () => {
    const { fetch, client: c } = client(200, { next_max_id: 5 });
    await expect(c.page("9", undefined)).resolves.toEqual({
      usernames: [],
      next: undefined,
    });
    expect(fetch.mock.calls[0]?.[0]).toBe(
      "/api/v1/friendships/9/following/?count=25",
    );
  });

  it("marks a 429 as a refusal worth waiting out", async () => {
    await expect(
      client(429, {}).client.page("9", undefined),
    ).rejects.toBeInstanceOf(RefusedError);
  });

  it.each([
    [200, "<html>", "HTTP 200"],
    [
      400,
      { status: "fail", message: "Please wait a few minutes" },
      "Please wait a few minutes",
    ],
  ])("reports status %i with %j as %s", async (status, body, reason) => {
    const failure = client(status, body).client.page("9", undefined);
    await expect(failure).rejects.toThrow(
      `Instagram would not list who you follow (${reason})`,
    );
    await expect(failure).rejects.not.toBeInstanceOf(RefusedError);
  });
});
