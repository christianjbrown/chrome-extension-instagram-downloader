// One page of who an account follows.
import type { ProcedureOutput } from "../bridge";
import { list, optional, record, text } from "../schemas";

declare module "../bridge" {
  interface Procedures {
    followingPage: {
      input: { userId: string; next: string | undefined };
      output: FollowingPage;
    };
  }
}

export const FOLLOWING_PAGE_PROCEDURE = {
  name: "followingPage",
  parse: (value) => {
    const raw = record(value, "page of accounts");
    return {
      usernames: list(
        raw.usernames,
        (v) => text(v, "username"),
        "list of usernames",
      ),
      next: optional(raw.next, (v) => text(v, "cursor")),
    };
  },
} as const satisfies ProcedureOutput<"followingPage">;
