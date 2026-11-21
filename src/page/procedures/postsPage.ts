// One page of an account's posts. The total comes free from the profile
// Instagram already loaded, so it is only there when the account's page has
// been visited.
import type { Input, PostsPage } from "../../shared/bridge";
import { isRecord } from "../../shared/json";
import { POSTS_PAGE_PROCEDURE } from "../../shared/procedures/postsPage";
import type {
  FieldCheck,
  PageProcedure,
  PostCountLookup,
  PostsQuery,
} from "../ports";

type Name = typeof POSTS_PAGE_PROCEDURE.name;

export class PostsPageProcedure implements PageProcedure<Name> {
  readonly name = POSTS_PAGE_PROCEDURE.name;

  constructor(
    private readonly users: PostCountLookup,
    private readonly queries: PostsQuery,
    private readonly username: FieldCheck,
    private readonly cursor: FieldCheck,
  ) {}

  isInput(input: unknown): input is Input<Name> {
    return (
      isRecord(input) &&
      this.username.accepts(input.username) &&
      this.cursor.accepts(input.cursor)
    );
  }

  async handle({ username, cursor }: Input<Name>): Promise<PostsPage> {
    const page = await this.queries.postsPage(username, cursor);
    const total = this.users.postCount(username);
    return total === undefined ? page : { ...page, total };
  }
}
