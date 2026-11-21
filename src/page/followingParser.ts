// Reads one page of who someone follows out of an answer the policy accepted.
import type { FollowingPage } from "../shared/bridge";
import { hasUsername, type JsonObject } from "../shared/json";
import type { FollowingParser } from "./ports";

const usernameOf = (user: unknown): string[] =>
  hasUsername(user) ? [user.username] : [];

function usernames(users: unknown): string[] {
  return Array.isArray(users) ? (users as unknown[]).flatMap(usernameOf) : [];
}

export class FollowingPageParser implements FollowingParser {
  parse(body: JsonObject): FollowingPage {
    return {
      usernames: usernames(body.users),
      next: typeof body.next_max_id === "string" ? body.next_max_id : undefined,
    };
  }
}
