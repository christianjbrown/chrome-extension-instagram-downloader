// Tells a rate limit apart from every other way a request can fail, so the
// content script only backs off when Instagram really asked it to.
import { RefusedError, TOO_MANY_REQUESTS } from "../shared/refusal";

export interface RefusalDetector {
  isRefusal(error: unknown): boolean;
}

const refusalText =
  /\b429\b|please wait|rate.?limit|too many requests|try again later|feedback_required/i;

const statusOf = (error: unknown): unknown =>
  typeof error === "object" && error !== null
    ? (error as { status?: unknown }).status
    : undefined;

export class InstagramRefusalDetector implements RefusalDetector {
  isRefusal(error: unknown): boolean {
    if (error instanceof RefusedError || statusOf(error) === TOO_MANY_REQUESTS)
      return true;
    const text = error instanceof Error ? error.message : String(error);
    return refusalText.test(text);
  }
}
