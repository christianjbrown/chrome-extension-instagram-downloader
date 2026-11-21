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

const storiesSegment = "stories";
const highlightsSegment = "highlights";

const postPrefixes = new Set(["p", "reel", "tv"]);

const reservedFirstSegments = new Set([
  "accounts",
  "direct",
  "explore",
  "reels",
  storiesSegment,
  ...postPrefixes,
]);

type RouteMatcher = (segments: readonly string[]) => Route | undefined;

function storyRoute([owner, media]: readonly string[]): Route {
  if (owner === undefined) return other;
  if (owner !== highlightsSegment)
    return { kind: "story", username: owner, mediaId: media };
  return media === undefined
    ? other
    : { kind: "highlight", highlightId: media };
}

// /stories/name/id/, or /stories/highlights/id/ for a highlight.
const story: RouteMatcher = ([first, ...rest]) =>
  first === storiesSegment ? storyRoute(rest) : undefined;

// /p/code/, or /name/p/code/ for a post opened from a profile.
const post: RouteMatcher = (segments) => {
  const [first] = segments;
  if (first === undefined) return undefined;
  const start = postPrefixes.has(first) ? 0 : 1;
  const prefix = segments[start];
  const shortcode = segments[start + 1];
  return prefix !== undefined && postPrefixes.has(prefix) && shortcode
    ? { kind: "post", shortcode }
    : undefined;
};

// /name/, as long as the name is not one of Instagram's own pages.
const profile: RouteMatcher = ([first, ...rest]) =>
  first !== undefined && rest.length === 0 && !reservedFirstSegments.has(first)
    ? { kind: "profile", username: first }
    : undefined;

// Tried in order, and the first that recognises the path wins.
const matchers: readonly RouteMatcher[] = [story, post, profile];

export function parseRoute(pathname: string): Route {
  const segments = pathname.split("/").filter((segment) => segment !== "");
  for (const match of matchers) {
    const route = match(segments);
    if (route !== undefined) return route;
  }
  return other;
}
