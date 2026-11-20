import {
  BlockedError,
  abortError,
  errorMessage,
  isAbortError,
  isContextInvalidated,
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

it("explains a reloaded extension instead of Chrome's wording", () => {
  const invalidated = new Error("Extension context invalidated.");
  expect(isContextInvalidated(invalidated)).toBe(true);
  expect(isContextInvalidated(new Error("x"))).toBe(false);
  expect(isContextInvalidated("Extension context invalidated.")).toBe(false);
  expect(errorMessage(invalidated)).toBe(
    "The extension was reloaded or updated. Reload this page to carry on.",
  );
});
