import {
  BlockedError,
  abortError,
  errorMessage,
  isAbortError,
} from "../../src/content/errors";

it("recognises a stop", () => {
  expect(isAbortError(abortError())).toBe(true);
  expect(isAbortError(new DOMException("x", "NotFoundError"))).toBe(false);
  expect(isAbortError(new Error("x"))).toBe(false);
});

it("describes any error as text", () => {
  expect(errorMessage(new BlockedError("blocked"))).toBe("blocked");
  expect(errorMessage(42)).toBe("42");
  expect(new BlockedError("b").name).toBe("BlockedError");
});
