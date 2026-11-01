// Lists the accounts a user follows, a page at a time, through the same REST
// endpoint Instagram's own "Following" dialog uses.
import type { FollowingPage } from "../shared/bridge";
import { RefusedError } from "../shared/refusal";
import { isJsonObject, type ModuleRequire } from "./relayClient";

type Fetch = (url: string, init: RequestInit) => Promise<Response>;

function usernames(users: unknown): string[] {
  if (!Array.isArray(users)) return [];
  return (users as unknown[]).flatMap((user) =>
    isJsonObject(user) && typeof user.username === "string"
      ? [user.username]
      : [],
  );
}

function failureReason(response: Response, body: unknown): string {
  const said =
    isJsonObject(body) && typeof body.message === "string"
      ? body.message
      : undefined;
  return said ?? `HTTP ${String(response.status)}`;
}

export class FollowingClient {
  constructor(
    private readonly require: ModuleRequire,
    private readonly fetch: Fetch,
  ) {}

  private headers(): Record<string, string> {
    const config = this.require("PolarisConfig") as { getIGAppID(): string };
    const claim = this.require("PolarisWWWClaim") as {
      getWWWClaim(): string;
    };
    return {
      "x-ig-app-id": config.getIGAppID(),
      "x-ig-www-claim": claim.getWWWClaim(),
    };
  }

  async page(userId: string, next: string | undefined): Promise<FollowingPage> {
    if (!/^\d+$/.test(userId)) throw new Error("Invalid user id");
    const query = new URLSearchParams({ count: "25" });
    if (next !== undefined) query.set("max_id", next);
    const response = await this.fetch(
      `/api/v1/friendships/${encodeURIComponent(userId)}/following/?${query.toString()}`,
      { headers: this.headers() },
    );
    const body: unknown = await response.json().catch(() => undefined);
    if (response.status === 429)
      throw new RefusedError("Instagram asked us to slow down");
    if (!isJsonObject(body) || body.status === "fail")
      throw new Error(
        `Instagram would not list who you follow (${failureReason(response, body)})`,
      );
    return {
      usernames: usernames(body.users),
      next: typeof body.next_max_id === "string" ? body.next_max_id : undefined,
    };
  }
}
