import {
  OwnMessage,
  ReloadedExtensionWording,
  StoppedRunWording,
  WordedErrors,
} from "../../src/content/errorText";
import {
  BlockedError,
  abortError,
  isAbortError,
  isContextInvalidated,
} from "../../src/content/errors";

const invalidated = new Error("Extension context invalidated.");

it("recognises a stop", () => {
  expect(isAbortError(abortError())).toBe(true);
  expect(isAbortError(new DOMException("x", "NotFoundError"))).toBe(false);
  expect(isAbortError(new Error("x"))).toBe(false);
});

it("describes any error as its own message", () => {
  expect(new OwnMessage().describe(new BlockedError("blocked"))).toBe(
    "blocked",
  );
  expect(new OwnMessage().describe(42)).toBe("42");
  expect(new BlockedError("b").name).toBe("BlockedError");
});

it("recognises a reloaded extension", () => {
  expect(isContextInvalidated(invalidated)).toBe(true);
  expect(isContextInvalidated(new Error("x"))).toBe(false);
  expect(isContextInvalidated("Extension context invalidated.")).toBe(false);
});

it("explains a reloaded extension instead of Chrome's wording", () => {
  const wording = new ReloadedExtensionWording();
  expect(wording.matches(invalidated)).toBe(true);
  expect(wording.matches(new Error("x"))).toBe(false);
  expect(wording.text()).toBe(
    "The extension was reloaded or updated. Reload this page to carry on.",
  );
});

it("says how to carry on a stopped run", () => {
  const wording = new StoppedRunWording();
  expect(wording.matches(abortError())).toBe(true);
  expect(wording.matches(new Error("x"))).toBe(false);
  expect(wording.text()).toBe(
    "Stopped. Start it again to carry on where it left off.",
  );
});

describe("WordedErrors", () => {
  const fallback = { describe: vi.fn(() => "fallback") };
  const first = { matches: vi.fn(() => false), text: vi.fn(() => "first") };
  const second = { matches: vi.fn(() => true), text: vi.fn(() => "second") };

  it("uses the first wording that recognises the error", () => {
    const error = new Error("x");
    expect(new WordedErrors([first, second], fallback).describe(error)).toBe(
      "second",
    );
    expect(first.matches).toHaveBeenCalledWith(error);
    expect(second.text).toHaveBeenCalledWith(error);
    expect(fallback.describe).not.toHaveBeenCalled();
  });

  it("leaves an error no wording recognises to the fallback", () => {
    expect(new WordedErrors([first], fallback).describe("plain")).toBe(
      "fallback",
    );
    expect(fallback.describe).toHaveBeenCalledWith("plain");
  });
});
