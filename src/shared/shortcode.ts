const alphabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

// Private posts carry a 28 character suffix after the real shortcode.
const privateSuffixLength = 28;

export function shortcodeToMediaId(shortcode: string): string {
  const code =
    shortcode.length > privateSuffixLength
      ? shortcode.slice(0, shortcode.length - privateSuffixLength)
      : shortcode;
  let id = 0n;
  for (const character of code) {
    id = id * 64n + BigInt(alphabet.indexOf(character));
  }
  return id.toString();
}

const postPath = /\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/;

export function shortcodeFromPath(path: string): string | undefined {
  return postPath.exec(path)?.[1];
}
