// What kind of Instagram page a path is.
import type { RouteParser } from "./ports";

// The kinds of page a route can be, by the name each route carries.
export const ROUTE_KINDS = {
  post: "post",
  profile: "profile",
  story: "story",
  highlight: "highlight",
  other: "other",
} as const;

type Kinds = typeof ROUTE_KINDS;

export type Route =
  | { readonly kind: Kinds["post"]; readonly shortcode: string }
  | { readonly kind: Kinds["profile"]; readonly username: string }
  | {
      readonly kind: Kinds["story"];
      readonly username: string;
      readonly mediaId: string | undefined;
    }
  | { readonly kind: Kinds["highlight"]; readonly highlightId: string }
  | { readonly kind: Kinds["other"] };

export type PostRoute = Extract<Route, { kind: Kinds["post"] }>;
export type ProfileRoute = Extract<Route, { kind: Kinds["profile"] }>;

const other: Route = { kind: ROUTE_KINDS.other };

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
    return { kind: ROUTE_KINDS.story, username: owner, mediaId: media };
  return media === undefined
    ? other
    : { kind: ROUTE_KINDS.highlight, highlightId: media };
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
    ? { kind: ROUTE_KINDS.post, shortcode }
    : undefined;
};

// /name/, as long as the name is not one of Instagram's own pages.
const profile: RouteMatcher = ([first, ...rest]) =>
  first !== undefined && rest.length === 0 && !reservedFirstSegments.has(first)
    ? { kind: ROUTE_KINDS.profile, username: first }
    : undefined;

// Tried in order, and the first that recognises the path wins.
const matchers: readonly RouteMatcher[] = [story, post, profile];

function parseRoute(pathname: string): Route {
  const segments = pathname.split("/").filter((segment) => segment !== "");
  for (const match of matchers) {
    const route = match(segments);
    if (route !== undefined) return route;
  }
  return other;
}

export class PathRouteParser implements RouteParser {
  parse(pathname: string): Route {
    return parseRoute(pathname);
  }
}
