// Tells a rate limit apart from every other way a request can fail, so the
// content script only backs off when Instagram really asked it to. Each sign
// of a refusal is its own class, and the wiring lists them.
import { errorMessage } from "../shared/errorMessage";
import { isJsonObject } from "../shared/json";
import { RefusedError, TOO_MANY_REQUESTS } from "../shared/refusal";
import type { RefusalDetector } from "./ports";

/** A refusal whenever any one of its signs says so. */
export class AnyRefusalSign implements RefusalDetector {
  constructor(private readonly signs: readonly RefusalDetector[]) {}

  isRefusal(error: unknown): boolean {
    return this.signs.some((sign) => sign.isRefusal(error));
  }
}

/** Already marked as a refusal by its type. */
export class RefusedErrorSign implements RefusalDetector {
  isRefusal(error: unknown): boolean {
    return error instanceof RefusedError;
  }
}

const statusOf = (error: unknown): unknown =>
  isJsonObject(error) ? error.status : undefined;

/** Answered with the status that means too many requests. */
export class TooManyRequestsSign implements RefusalDetector {
  isRefusal(error: unknown): boolean {
    return statusOf(error) === TOO_MANY_REQUESTS;
  }
}

/** Worded the way Instagram words a refusal. */
export class RefusalWordingSign implements RefusalDetector {
  constructor(private readonly wordings: readonly RegExp[]) {}

  isRefusal(error: unknown): boolean {
    const message = errorMessage(error);
    return this.wordings.some((wording) => wording.test(message));
  }
}
