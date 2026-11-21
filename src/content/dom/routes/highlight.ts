// A saved highlight: /stories/highlights/id/.
import type { RouteKind } from "../ports";
import type { Route } from "../route";

export const HIGHLIGHT_KIND = "highlight";

export interface HighlightRoute {
  readonly kind: typeof HIGHLIGHT_KIND;
  readonly highlightId: string;
}

export class HighlightPage implements RouteKind<HighlightRoute> {
  matches(route: Route): route is HighlightRoute {
    return route.kind === HIGHLIGHT_KIND;
  }
}
