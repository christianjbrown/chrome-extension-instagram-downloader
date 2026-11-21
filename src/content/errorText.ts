// Turns any error into the words shown to the user.
import { isContextInvalidated } from "./errors";
import type { ErrorDescriber } from "./ports";

const contextInvalidatedMessage =
  "The extension was reloaded or updated. Reload this page to carry on.";

// Explains a reloaded extension in plain words, and shows any other error's
// own message.
export class UserErrorText implements ErrorDescriber {
  describe(error: unknown): string {
    if (isContextInvalidated(error)) return contextInvalidatedMessage;
    return error instanceof Error ? error.message : String(error);
  }
}
