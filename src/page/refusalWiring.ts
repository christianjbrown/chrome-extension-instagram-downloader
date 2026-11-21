// Lists the signs that Instagram refused a request because too many were
// made: by type or status first, before any wording.
import { TOO_MANY_REQUESTS } from "../shared/refusal";
import type { RefusalDetector } from "./ports";
import {
  AnyRefusalSign,
  RefusalWordingSign,
  RefusedErrorSign,
  TooManyRequestsSign,
} from "./refusalDetector";

export function refusalDetector(): RefusalDetector {
  return new AnyRefusalSign([
    new RefusedErrorSign(),
    new TooManyRequestsSign(),
    new RefusalWordingSign([
      new RegExp(`\\b${String(TOO_MANY_REQUESTS)}\\b`),
      /please wait/i,
      /rate.?limit/i,
      /too many requests/i,
      /try again later/i,
      /feedback_required/i,
    ]),
  ]);
}
