export class BlockedError extends Error {
  override readonly name = "BlockedError";
}

export const abortError = (): DOMException =>
  new DOMException("Stopped", "AbortError");

export const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === "AbortError";

export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
