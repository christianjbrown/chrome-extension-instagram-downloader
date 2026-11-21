import { PAGE_CONFIG } from "../../src/page/config";
import { procedureTable } from "../../src/page/procedureWiring";
import type { ProcedureName } from "../../src/shared/bridge";

// The input checks never reach what the procedures answer from.
const procedures = procedureTable({} as never, PAGE_CONFIG.inputLimits);
const isValidInput = (name: ProcedureName, input: unknown): boolean =>
  procedures[name].isInput(input);

describe("procedure inputs", () => {
  it("accepts what the content script really sends", () => {
    expect(isValidInput("viewer", {})).toBe(true);
    expect(isValidInput("media", { mediaId: "123_456" })).toBe(true);
    expect(isValidInput("mediaByAsset", { asset: "pic.jpg" })).toBe(true);
    expect(
      isValidInput("postsPage", { username: "a.b_c", cursor: undefined }),
    ).toBe(true);
    expect(isValidInput("postsPage", { username: "a", cursor: "x" })).toBe(
      true,
    );
    expect(isValidInput("account", { username: "alice" })).toBe(true);
    expect(isValidInput("followingPage", { userId: "9", next: "n" })).toBe(
      true,
    );
    expect(isValidInput("reel", { reelId: "highlight:17" })).toBe(true);
    expect(isValidInput("userReel", { username: "alice" })).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isValidInput("viewer", [])).toBe(false);
    expect(isValidInput("media", { mediaId: "a/b" })).toBe(false);
    expect(isValidInput("mediaByAsset", { asset: "../x" })).toBe(false);
    expect(isValidInput("postsPage", { username: "a", cursor: 4 })).toBe(false);
    expect(isValidInput("postsPage", { username: "a b" })).toBe(false);
    expect(isValidInput("account", { username: "x".repeat(31) })).toBe(false);
    expect(isValidInput("followingPage", { userId: "9/x" })).toBe(false);
    expect(isValidInput("reel", {})).toBe(false);
    expect(isValidInput("userReel", null)).toBe(false);
  });
});
