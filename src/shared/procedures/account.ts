// An account's id, picture and post count, by its username.
import type { Account, ProcedureOutput } from "../bridge";
import type { AddressCheck } from "../checks";
import { count, optional, record, text } from "../schemas";

export const ACCOUNT_PROCEDURE = "account";

declare module "../bridge" {
  interface Procedures {
    account: { input: { username: string }; output: Account };
  }
}

export class AccountOutput implements ProcedureOutput<
  typeof ACCOUNT_PROCEDURE
> {
  readonly name = ACCOUNT_PROCEDURE;

  constructor(private readonly addresses: AddressCheck) {}

  parse(value: unknown): Account {
    const raw = record(value, "account");
    return {
      id: text(raw.id, "account"),
      username: text(raw.username, "account"),
      profilePicUrl: optional(raw.profilePicUrl, (v) =>
        this.addresses.mediaUrl(v),
      ),
      totalPosts: count(raw.totalPosts, "account"),
    };
  }
}
