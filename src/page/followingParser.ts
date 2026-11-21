// Reads one page of who someone follows out of an answer the policy accepted.
import type { FollowingPage } from "../shared/bridge";
import { isJsonObject, type JsonObject } from "../shared/json";
import type { FollowingParser } from "./ports";

function usernames(users: unknown): string[] {
  if (!Array.isArray(users)) return [];
  return (users as unknown[]).flatMap((user) =>
    isJsonObject(user) && typeof user.username === "string"
      ? [user.username]
      : [],
  );
}

export class FollowingPageParser implements FollowingParser {
  parse(body: JsonObject): FollowingPage {
    return {
      usernames: usernames(body.users),
      next: typeof body.next_max_id === "string" ? body.next_max_id : undefined,
    };
  }
}
