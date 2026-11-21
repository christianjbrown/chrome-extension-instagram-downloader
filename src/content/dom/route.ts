// What kind of Instagram page a path is.
import type { PathMatcher, RouteParser } from "./ports";

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

export const OTHER_ROUTE: Route = { kind: ROUTE_KINDS.other };

// Splits a path into its segments and asks each matcher in turn, in the
// order given, and the first that recognises the path wins.
export class PathRouteParser implements RouteParser {
  constructor(private readonly matchers: readonly PathMatcher[]) {}

  parse(pathname: string): Route {
    const segments = pathname.split("/").filter((segment) => segment !== "");
    const matched = this.matchers.reduce<Route | undefined>(
      (route, matcher) => route ?? matcher.match(segments),
      undefined,
    );
    return matched ?? OTHER_ROUTE;
  }
}
