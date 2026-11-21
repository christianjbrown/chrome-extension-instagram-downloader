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

/** Marks where the user's id goes in the endpoint's path. */
export const USER_ID_PLACEHOLDER = "{userId}";

export interface FollowingEndpoint {
  /** The path, with USER_ID_PLACEHOLDER where the id goes. */
  readonly path: string;
  readonly pageSize: number;
}

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
    private readonly endpoint: FollowingEndpoint,
  ) {}

  private path(userId: string): string {
    return this.endpoint.path.replace(
      USER_ID_PLACEHOLDER,
      encodeURIComponent(userId),
    );
  }

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
    const query = new URLSearchParams({
      count: String(this.endpoint.pageSize),
    });
    if (next !== undefined) query.set("max_id", next);
    const response = await this.fetch(
      `${this.path(userId)}?${query.toString()}`,
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
