// An account's id, picture and post count, by its username.
import type { ProcedureOutput } from "../bridge";
import { count, mediaUrl, optional, record, text } from "../schemas";

declare module "../bridge" {
  interface Procedures {
    account: { input: { username: string }; output: Account };
  }
}

export const ACCOUNT_PROCEDURE = {
  name: "account",
  parse: (value) => {
    const raw = record(value, "account");
    return {
      id: text(raw.id, "account"),
      username: text(raw.username, "account"),
      profilePicUrl: optional(raw.profilePicUrl, mediaUrl),
      totalPosts: count(raw.totalPosts, "account"),
    };
  },
} as const satisfies ProcedureOutput<"account">;
