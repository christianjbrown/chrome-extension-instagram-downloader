// One page of an account's posts.
import type { PostsPage, ProcedureOutput } from "../bridge";
import type { PostListCheck } from "../checks";
import { count, optional, record, text } from "../schemas";

export const POSTS_PAGE_PROCEDURE = "postsPage";

declare module "../bridge" {
  interface Procedures {
    postsPage: {
      input: { username: string; cursor: string | undefined };
      output: PostsPage;
    };
  }
}

export class PostsPageOutput implements ProcedureOutput<
  typeof POSTS_PAGE_PROCEDURE
> {
  readonly name = POSTS_PAGE_PROCEDURE;

  constructor(private readonly posts: PostListCheck) {}

  parse(value: unknown): PostsPage {
    const raw = record(value, "page of posts");
    const readable = this.posts.readablePosts(raw.items);
    // The page leaves out posts with no id at all, and says how many.
    const leftOut = optional(raw.unreadable, (v) => count(v, "post count"));
    const unreadable = readable.unreadable + (leftOut ?? 0);
    const total = optional(raw.total, (v) => count(v, "post count"));
    return {
      items: readable.items,
      cursor: optional(raw.cursor, (v) => text(v, "cursor")),
      ...(unreadable === 0 ? {} : { unreadable }),
      ...(total === undefined ? {} : { total }),
    };
  }
}
