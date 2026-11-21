// Turns any error into the words shown to the user.
import { isContextInvalidated } from "./errors";

const contextInvalidatedMessage =
  "The extension was reloaded or updated. Reload this page to carry on.";

export const errorMessage = (error: unknown): string => {
  if (isContextInvalidated(error)) return contextInvalidatedMessage;
  return error instanceof Error ? error.message : String(error);
};
