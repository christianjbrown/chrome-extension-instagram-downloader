// What kind of Instagram page a path is.
import type { PathMatcher, RouteParser } from "./ports";
import type { Route } from "./route";
import { OTHER_ROUTE } from "./routes/other";

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
