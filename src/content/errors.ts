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
const contextInvalidatedMessage =
  "The extension was reloaded or updated. Reload this page to carry on.";

export const isContextInvalidated = (error: unknown): boolean =>
  error instanceof Error && error.message.includes(contextInvalidatedText);

export const errorMessage = (error: unknown): string => {
  if (isContextInvalidated(error)) return contextInvalidatedMessage;
  return error instanceof Error ? error.message : String(error);
};
