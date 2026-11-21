const alphabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
// Each character is one digit in a number written in the alphabet's base.
const base = BigInt(alphabet.length);

// Private posts carry a 28 character suffix after the real shortcode.
const privateSuffixLength = 28;

const withoutPrivateSuffix = (shortcode: string): string =>
  shortcode.length > privateSuffixLength
    ? shortcode.slice(0, shortcode.length - privateSuffixLength)
    : shortcode;

// The value of a code with no digits read yet.
const noDigits = 0n;

export function shortcodeToMediaId(shortcode: string): string {
  return Array.from(withoutPrivateSuffix(shortcode))
    .reduce(
      (id, character) => id * base + BigInt(alphabet.indexOf(character)),
      noDigits,
    )
    .toString();
}

const postPath = /\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/;

export function shortcodeFromPath(path: string): string | undefined {
  return postPath.exec(path)?.[1];
}
