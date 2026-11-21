// Tells a rate limit apart from every other way a request can fail, so the
// content script only backs off when Instagram really asked it to.
import { errorMessage } from "../shared/errorMessage";
import { isJsonObject } from "../shared/json";
import { RefusedError, TOO_MANY_REQUESTS } from "../shared/refusal";
import type { RefusalDetector } from "./ports";

const refusalText = new RegExp(
  `\\b${String(TOO_MANY_REQUESTS)}\\b|please wait|rate.?limit|too many requests|try again later|feedback_required`,
  "i",
);

const statusOf = (error: unknown): unknown =>
  isJsonObject(error) ? error.status : undefined;

// Marked as a refusal by its type or by its status, before any wording.
const isMarked = (error: unknown): boolean =>
  error instanceof RefusedError || statusOf(error) === TOO_MANY_REQUESTS;

export class InstagramRefusalDetector implements RefusalDetector {
  isRefusal(error: unknown): boolean {
    return isMarked(error) || refusalText.test(errorMessage(error));
  }
}
