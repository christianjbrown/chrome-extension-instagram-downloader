// One page of an account's posts.
import type { ProcedureOutput } from "../bridge";
import { count, optional, readablePosts, record, text } from "../schemas";

declare module "../bridge" {
  interface Procedures {
    postsPage: {
      input: { username: string; cursor: string | undefined };
      output: PostsPage;
    };
  }
}

export const POSTS_PAGE_PROCEDURE = {
  name: "postsPage",
  parse: (value) => {
    const raw = record(value, "page of posts");
    const { items, unreadable } = readablePosts(raw.items);
    const total = optional(raw.total, (v) => count(v, "post count"));
    return {
      items,
      cursor: optional(raw.cursor, (v) => text(v, "cursor")),
      ...(unreadable === 0 ? {} : { unreadable }),
      ...(total === undefined ? {} : { total }),
    };
  },
} as const satisfies ProcedureOutput<"postsPage">;
