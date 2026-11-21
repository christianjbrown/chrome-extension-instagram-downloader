import { errorMessage } from "../shared/errorMessage";
// Turns any error into the words shown to the user.
import { isAbortError, isContextInvalidated } from "./errors";
import type { ErrorDescriber, ErrorWording } from "./ports";

const contextInvalidatedMessage =
  "The extension was reloaded or updated. Reload this page to carry on.";
const stoppedRunMessage =
  "Stopped. Start it again to carry on where it left off.";

// Words each error with the first wording that recognises it, and leaves
// the rest to the fallback.
export class WordedErrors implements ErrorDescriber {
  constructor(
    private readonly wordings: readonly ErrorWording[],
    private readonly fallback: ErrorDescriber,
  ) {}

  describe(error: unknown): string {
    const wording = this.wordings.find((candidate) => candidate.matches(error));
    return wording === undefined
      ? this.fallback.describe(error)
      : wording.text(error);
  }
}

// Shows an error's own message, or the value itself when it is not an error.
export class OwnMessage implements ErrorDescriber {
  describe(error: unknown): string {
    return errorMessage(error);
  }
}

// Explains a reloaded extension in plain words instead of Chrome's.
export class ReloadedExtensionWording implements ErrorWording {
  matches(error: unknown): boolean {
    return isContextInvalidated(error);
  }

  text(): string {
    return contextInvalidatedMessage;
  }
}

// A bulk run the user stopped, which carries on where it left off next time.
export class StoppedRunWording implements ErrorWording {
  matches(error: unknown): boolean {
    return isAbortError(error);
  }

  text(): string {
    return stoppedRunMessage;
  }
}
