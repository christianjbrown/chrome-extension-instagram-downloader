// One page of an account's posts.
import type { PostsPage, ProcedureOutput } from "../bridge";
import type { PostListCheck } from "../checks";
import { optionalField, someCount } from "../fields";
import { count, optional, record, text } from "../schemas";

export const POSTS_PAGE_PROCEDURE = "postsPage";

const postCount = (value: unknown): number => count(value, "post count");

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
    const unreadable = readable.unreadable + this.leftOut(raw.unreadable);
    return {
      items: readable.items,
      cursor: optional(raw.cursor, (v) => text(v, "cursor")),
      ...optionalField("unreadable", someCount(unreadable)),
      ...optionalField("total", optional(raw.total, postCount)),
    };
  }

  // The page leaves out posts with no id at all, and says how many.
  private leftOut(value: unknown): number {
    return optional(value, postCount) ?? 0;
  }
}
