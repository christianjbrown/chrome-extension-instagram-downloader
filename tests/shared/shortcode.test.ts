import {
  shortcodeFromPath,
  shortcodeToMediaId,
} from "../../src/shared/shortcode";

describe("shortcodeToMediaId", () => {
  it("decodes a public shortcode", () => {
    expect(shortcodeToMediaId("De_haHANj_2")).toBe("4017076322398781430");
  });

  it("ignores the suffix private posts carry", () => {
    expect(shortcodeToMediaId(`De_haHANj_2${"x".repeat(28)}`)).toBe(
      "4017076322398781430",
    );
  });
});

describe("shortcodeFromPath", () => {
  it.each([
    ["/p/abc/", "abc"],
    ["/reel/r-1_/", "r-1_"],
    ["/tv/t/", "t"],
    ["/name/p/abc/", "abc"],
  ])("reads %s", (path, code) => {
    expect(shortcodeFromPath(path)).toBe(code);
  });

  it("is undefined elsewhere", () => {
    expect(shortcodeFromPath("/explore/")).toBeUndefined();
  });
});
