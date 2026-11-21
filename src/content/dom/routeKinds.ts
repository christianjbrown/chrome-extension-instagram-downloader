// Recognises a page that is any one of several kinds, such as the story
// viewer, which shows both an account's stories and a highlight.
import type { RouteKind } from "./ports";
import type { Route } from "./route";

export class AnyRouteKind<R extends Route> implements RouteKind<R> {
  constructor(private readonly kinds: readonly RouteKind<R>[]) {}

  matches(route: Route): route is R {
    return this.kinds.some((kind) => kind.matches(route));
  }
}
