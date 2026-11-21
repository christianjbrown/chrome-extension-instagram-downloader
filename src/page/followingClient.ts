// Lists the accounts a user follows, a page at a time, through the same REST
// endpoint Instagram's own "Following" dialog uses.
import type { FollowingPage } from "../shared/bridge";
import { RefusedError, TOO_MANY_REQUESTS } from "../shared/refusal";
import { FAILED_STATUS, HEADERS, MODULES } from "./instagramApi";
import { isJsonObject, type ModuleRequire } from "./relayClient";

type Fetch = (url: string, init: RequestInit) => Promise<Response>;

const text = {
  invalidUser: "Invalid user id",
  slowDown: "Instagram asked us to slow down",
  notListed: "Instagram would not list who you follow",
  http: "HTTP",
} as const;

const pageSize = 25;
const followingPath = (userId: string): string =>
  `/api/v1/friendships/${encodeURIComponent(userId)}/following/`;
const numericId = /^\d+$/;

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
  return said ?? `${text.http} ${String(response.status)}`;
}

export class FollowingClient {
  constructor(
    private readonly require: ModuleRequire,
    private readonly fetch: Fetch,
  ) {}

  private headers(): Record<string, string> {
    const config = this.require(MODULES.config) as { getIGAppID(): string };
    const claim = this.require(MODULES.claim) as {
      getWWWClaim(): string;
    };
    return {
      [HEADERS.appId]: config.getIGAppID(),
      [HEADERS.claim]: claim.getWWWClaim(),
    };
  }

  async page(userId: string, next: string | undefined): Promise<FollowingPage> {
    if (!numericId.test(userId)) throw new Error(text.invalidUser);
    const query = new URLSearchParams({ count: String(pageSize) });
    if (next !== undefined) query.set("max_id", next);
    const response = await this.fetch(
      `${followingPath(userId)}?${query.toString()}`,
      { headers: this.headers() },
    );
    const body: unknown = await response.json().catch(() => undefined);
    if (response.status === TOO_MANY_REQUESTS)
      throw new RefusedError(text.slowDown);
    if (!isJsonObject(body) || body.status === FAILED_STATUS)
      throw new Error(`${text.notListed} (${failureReason(response, body)})`);
    return {
      usernames: usernames(body.users),
      next: typeof body.next_max_id === "string" ? body.next_max_id : undefined,
    };
  }
}
