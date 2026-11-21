/** An error's own message, or the thrown value as text when it is not an Error. */
export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
