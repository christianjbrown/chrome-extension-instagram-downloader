const alphabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
// Each character is one digit in a number written in the alphabet's base.
const base = BigInt(alphabet.length);

// Private posts carry a 28 character suffix after the real shortcode.
const privateSuffixLength = 28;

export function shortcodeToMediaId(shortcode: string): string {
  const code =
    shortcode.length > privateSuffixLength
      ? shortcode.slice(0, shortcode.length - privateSuffixLength)
      : shortcode;
  let id = 0n;
  for (const character of code) {
    id = id * base + BigInt(alphabet.indexOf(character));
  }
  return id.toString();
}

const postPath = /\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/;

export function shortcodeFromPath(path: string): string | undefined {
  return postPath.exec(path)?.[1];
}
