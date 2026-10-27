// What kind of Instagram page a path is.
export type Route =
  | { readonly kind: "post"; readonly shortcode: string }
  | { readonly kind: "profile"; readonly username: string }
  | {
      readonly kind: "story";
      readonly username: string;
      readonly mediaId: string | undefined;
    }
  | { readonly kind: "highlight"; readonly highlightId: string }
  | { readonly kind: "other" };

const other: Route = { kind: "other" };

const postPrefixes = new Set(["p", "reel", "tv"]);

const reservedFirstSegments = new Set([
  "accounts",
  "direct",
  "explore",
  "reels",
  "stories",
  ...postPrefixes,
]);

function storyRoute([owner, media]: readonly string[]): Route {
  if (owner === undefined) return other;
  if (owner !== "highlights")
    return { kind: "story", username: owner, mediaId: media };
  return media === undefined
    ? other
    : { kind: "highlight", highlightId: media };
}

// /p/code/, or /name/p/code/ for a post opened from a profile.
function postRoute(
  first: string,
  segments: readonly string[],
): Route | undefined {
  const start = postPrefixes.has(first) ? 0 : 1;
  const prefix = segments[start];
  const shortcode = segments[start + 1];
  return prefix !== undefined && postPrefixes.has(prefix) && shortcode
    ? { kind: "post", shortcode }
    : undefined;
}

export function parseRoute(pathname: string): Route {
  const segments = pathname.split("/").filter((segment) => segment !== "");
  const [first, ...rest] = segments;
  if (first === undefined) return other;
  if (first === "stories") return storyRoute(rest);
  const post = postRoute(first, segments);
  if (post !== undefined) return post;
  return rest.length === 0 && !reservedFirstSegments.has(first)
    ? { kind: "profile", username: first }
    : other;
}
