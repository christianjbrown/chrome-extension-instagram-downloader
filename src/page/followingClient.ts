// Lists the accounts a user follows, a page at a time, through the same REST
// endpoint Instagram's own "Following" dialog uses.
import type { FollowingPage } from "../shared/bridge";
import { FOLLOWING_QUERY } from "./instagramApi";
import type {
  FollowingPages,
  FollowingParser,
  HeaderSource,
  ResponsePolicy,
} from "./ports";

type Fetch = (url: string, init: RequestInit) => Promise<Response>;

/** Marks where the user's id goes in the endpoint's path. */
export const USER_ID_PLACEHOLDER = "{userId}";

export interface FollowingEndpoint {
  /** The path, with USER_ID_PLACEHOLDER where the id goes. */
  readonly path: string;
  readonly pageSize: number;
}

/** How an answer is judged, then read. */
export interface FollowingAnswers {
  readonly policy: ResponsePolicy;
  readonly parser: FollowingParser;
}

const invalidUser = "Invalid user id";
const numericId = /^\d+$/;

export class FollowingClient implements FollowingPages {
  constructor(
    private readonly headers: HeaderSource,
    private readonly fetch: Fetch,
    private readonly endpoint: FollowingEndpoint,
    private readonly answers: FollowingAnswers,
  ) {}

  async page(userId: string, next: string | undefined): Promise<FollowingPage> {
    if (!numericId.test(userId)) throw new Error(invalidUser);
    const response = await this.fetch(this.url(userId, next), {
      headers: this.headers.headers(),
    });
    const body: unknown = await response.json().catch(() => undefined);
    const { policy, parser } = this.answers;
    return parser.parse(policy.accept(response.status, body));
  }

  private url(userId: string, next: string | undefined): string {
    const path = this.endpoint.path.replace(
      USER_ID_PLACEHOLDER,
      encodeURIComponent(userId),
    );
    const query = new URLSearchParams({
      [FOLLOWING_QUERY.count]: String(this.endpoint.pageSize),
    });
    if (next !== undefined) query.set(FOLLOWING_QUERY.after, next);
    return `${path}?${query.toString()}`;
  }
}
