// The ways a run can end that are not an ordinary failure, and how to tell
// them apart.
export class BlockedError extends Error {
  override readonly name = "BlockedError";
}

// The name the platform gives an error from an aborted signal.
const abortErrorName = "AbortError";
const stoppedMessage = "Stopped";

export const abortError = (): DOMException =>
  new DOMException(stoppedMessage, abortErrorName);

export const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === abortErrorName;

// What Chrome throws at a content script left running in an open tab after
// the extension is reloaded or updated. Only reloading the page fixes it.
const contextInvalidatedText = "Extension context invalidated";

export const isContextInvalidated = (error: unknown): boolean =>
  error instanceof Error && error.message.includes(contextInvalidatedText);

// A stop or a block ends the whole run, so no part of it may shrug one off
// and carry on.
export const endsTheRun = (error: unknown): boolean =>
  isAbortError(error) || error instanceof BlockedError;
