// Reads one page of who someone follows out of Instagram's REST answer.
import type { FollowingPage } from "../shared/bridge";
import { RefusedError, TOO_MANY_REQUESTS } from "../shared/refusal";
import { FAILED_STATUS } from "./instagramApi";
import { isJsonObject } from "../shared/json";

const text = {
  slowDown: "Instagram asked us to slow down",
  notListed: "Instagram would not list who you follow",
  http: "HTTP",
} as const;

function usernames(users: unknown): string[] {
  if (!Array.isArray(users)) return [];
  return (users as unknown[]).flatMap((user) =>
    isJsonObject(user) && typeof user.username === "string"
      ? [user.username]
      : [],
  );
}

function failureReason(status: number, body: unknown): string {
  const said =
    isJsonObject(body) && typeof body.message === "string"
      ? body.message
      : undefined;
  return said ?? `${text.http} ${String(status)}`;
}

export function parseFollowingPage(
  status: number,
  body: unknown,
): FollowingPage {
  if (status === TOO_MANY_REQUESTS) throw new RefusedError(text.slowDown);
  if (!isJsonObject(body) || body.status === FAILED_STATUS)
    throw new Error(`${text.notListed} (${failureReason(status, body)})`);
  return {
    usernames: usernames(body.users),
    next: typeof body.next_max_id === "string" ? body.next_max_id : undefined,
  };
}
