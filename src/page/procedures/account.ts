// An account by username: its id from what Instagram already sent, or from
// its own posts, and the rest from its profile.
import type { Account, Input } from "../../shared/bridge";
import { hasUsername, isRecord, type JsonObject } from "../../shared/json";
import { ACCOUNT_PROCEDURE } from "../../shared/procedures/account";
import type {
  FieldCheck,
  PageProcedure,
  PostsQuery,
  ProfileQuery,
  UserIdLookup,
} from "../ports";
import { found } from "./lookup";

type Name = typeof ACCOUNT_PROCEDURE;

const notFound = "Could not find";

const isNamed = (user: unknown, username: string): boolean =>
  hasUsername(user) && user.username === username;

export class AccountProcedure implements PageProcedure<Name> {
  readonly name = ACCOUNT_PROCEDURE;

  constructor(
    private readonly users: UserIdLookup,
    private readonly queries: PostsQuery & ProfileQuery,
    private readonly username: FieldCheck,
  ) {}

  isInput(input: unknown): input is Input<Name> {
    return isRecord(input) && this.username.accepts(input.username);
  }

  async handle({ username }: Input<Name>): Promise<Account> {
    const id = await this.userId(username);
    const profile = await this.queries.profile(id);
    return { id, ...profile };
  }

  private async userId(username: string): Promise<string> {
    return this.users.userId(username) ?? this.idFromPosts(username);
  }

  // Pinned collaborations can put someone else's post first.
  private async idFromPosts(username: string): Promise<string> {
    const { items } = await this.queries.postsPage(username, undefined);
    const owner = items
      .map((item) => item.user)
      .find((user): user is JsonObject & { pk?: unknown } =>
        isNamed(user, username),
      );
    return String(found(owner?.pk, `${notFound} ${username}`));
  }
}
