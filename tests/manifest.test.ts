import manifestJson from "../static/manifest.json";
import { pageOrigin } from "../src/shared/origin";

interface Manifest {
  permissions: string[];
  host_permissions?: string[];
  content_scripts: { matches: string[] }[];
}

const manifest: Manifest = manifestJson;

describe("manifest", () => {
  it("injects only on www.instagram.com, where the bridge works", () => {
    for (const script of manifest.content_scripts)
      expect(script.matches).toEqual(["https://www.instagram.com/*"]);
  });

  it("asks for no host access: content scripts fetch the CDN with the page's CORS", () => {
    expect(manifest.host_permissions).toBeUndefined();
    expect(manifest.permissions).toEqual(["storage"]);
  });
});

describe("page origin", () => {
  it("is where the manifest injects the scripts", () => {
    for (const script of manifest.content_scripts)
      expect(script.matches).toEqual([`${pageOrigin}/*`]);
  });
});
