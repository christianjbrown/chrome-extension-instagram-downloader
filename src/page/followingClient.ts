// Lists the accounts a user follows, a page at a time, through the same REST
// endpoint Instagram's own "Following" dialog uses.
import type { FollowingPage } from "../shared/bridge";
import { parseFollowingPage } from "./followingResponse";
import type { HeaderSource } from "./instagramHeaders";

type Fetch = (url: string, init: RequestInit) => Promise<Response>;

/** Marks where the user's id goes in the endpoint's path. */
export const USER_ID_PLACEHOLDER = "{userId}";

export interface FollowingEndpoint {
  /** The path, with USER_ID_PLACEHOLDER where the id goes. */
  readonly path: string;
  readonly pageSize: number;
}

const invalidUser = "Invalid user id";
const numericId = /^\d+$/;

export class FollowingClient {
  constructor(
    private readonly headers: HeaderSource,
    private readonly fetch: Fetch,
    private readonly endpoint: FollowingEndpoint,
  ) {}

  async page(userId: string, next: string | undefined): Promise<FollowingPage> {
    if (!numericId.test(userId)) throw new Error(invalidUser);
    const response = await this.fetch(this.url(userId, next), {
      headers: this.headers.headers(),
    });
    const body: unknown = await response.json().catch(() => undefined);
    return parseFollowingPage(response.status, body);
  }

  private url(userId: string, next: string | undefined): string {
    const path = this.endpoint.path.replace(
      USER_ID_PLACEHOLDER,
      encodeURIComponent(userId),
    );
    const query = new URLSearchParams({
      count: String(this.endpoint.pageSize),
    });
    if (next !== undefined) query.set("max_id", next);
    return `${path}?${query.toString()}`;
  }
}
