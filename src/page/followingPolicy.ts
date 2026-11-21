// Decides whether Instagram's answer to a following list is a page at all,
// and which failures are worth waiting out.
import { isJsonObject, type JsonObject } from "../shared/json";
import { RefusedError, TOO_MANY_REQUESTS } from "../shared/refusal";
import { FAILED_STATUS } from "./instagramApi";
import type { ResponsePolicy } from "./ports";

const text = {
  slowDown: "Instagram asked us to slow down",
  notListed: "Instagram would not list who you follow",
  http: "HTTP",
} as const;

function failureReason(status: number, body: unknown): string {
  const said =
    isJsonObject(body) && typeof body.message === "string"
      ? body.message
      : undefined;
  return said ?? `${text.http} ${String(status)}`;
}

export class FollowingPolicy implements ResponsePolicy {
  accept(status: number, body: unknown): JsonObject {
    if (status === TOO_MANY_REQUESTS) throw new RefusedError(text.slowDown);
    if (!isJsonObject(body) || body.status === FAILED_STATUS)
      throw new Error(`${text.notListed} (${failureReason(status, body)})`);
    return body;
  }
}
