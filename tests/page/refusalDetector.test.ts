import { refusalDetector } from "../../src/page/refusalWiring";
import { RefusedError } from "../../src/shared/refusal";

describe("refusalDetector", () => {
  const detector = refusalDetector();

  it.each([
    new RefusedError("slow down"),
    Object.assign(new Error("Network error"), { status: 429 }),
    new Error("Please wait a few minutes before you try again."),
    new Error("HTTP 429"),
    new Error("feedback_required"),
    "Too many requests",
  ])("treats %o as a refusal", (error) => {
    expect(detector.isRefusal(error)).toBe(true);
  });

  it.each([
    new Error("Account not found"),
    new Error("PolarisProfilePostsQuery is not available"),
    Object.assign(new Error("Server error"), { status: 500 }),
    null,
    "Instagram sent no data",
  ])("does not treat %o as a refusal", (error) => {
    expect(detector.isRefusal(error)).toBe(false);
  });
});
