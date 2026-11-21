// One page of who an account follows.
import type { FollowingPage, ProcedureOutput } from "../bridge";
import { list, optional, record, text } from "../schemas";

export const FOLLOWING_PAGE_PROCEDURE = "followingPage";

declare module "../bridge" {
  interface Procedures {
    followingPage: {
      input: { userId: string; next: string | undefined };
      output: FollowingPage;
    };
  }
}

export class FollowingPageOutput implements ProcedureOutput<
  typeof FOLLOWING_PAGE_PROCEDURE
> {
  readonly name = FOLLOWING_PAGE_PROCEDURE;

  parse(value: unknown): FollowingPage {
    const raw = record(value, "page of accounts");
    return {
      usernames: list(
        raw.usernames,
        (v) => text(v, "username"),
        "list of usernames",
      ),
      next: optional(raw.next, (v) => text(v, "cursor")),
    };
  }
}
