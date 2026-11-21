import entries from "../scripts/entries.json";
import manifest from "../static/manifest.json";

const bundles = Object.keys(entries).map((name) => `${name}.js`);

describe("build entries", () => {
  it("bundles every script the manifest injects, and nothing else", () => {
    const injected = manifest.content_scripts.flatMap((script) => script.js);
    expect(new Set(injected)).toEqual(new Set(bundles));
  });
});
