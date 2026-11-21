// Instagram turned a request down because too many were made, as opposed to
// any other failure. Only this one is worth waiting out.
export class RefusedError extends Error {
  override readonly name = "RefusedError";
}

/** The HTTP status Instagram answers with when it wants fewer requests. */
export const TOO_MANY_REQUESTS = 429;
