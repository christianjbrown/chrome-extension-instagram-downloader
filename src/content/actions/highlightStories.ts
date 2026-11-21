import type { Reel } from "../../shared/bridge";
import { ROUTE_KINDS, type Route } from "../dom/route";
import type { Bridge } from "../ports";
import type { StoryKind, StoryRoute } from "./ports";

type HighlightRoute = Extract<Route, { kind: typeof ROUTE_KINDS.highlight }>;

// /stories/highlights/id/: a saved highlight, whose address names neither
// the story showing nor whose it is.
export class HighlightStories implements StoryKind<HighlightRoute> {
  constructor(private readonly bridge: Bridge) {}

  matches(route: StoryRoute): route is HighlightRoute {
    return route.kind === ROUTE_KINDS.highlight;
  }

  mediaId(): undefined {
    return undefined;
  }

  owner(): undefined {
    return undefined;
  }

  reel(route: HighlightRoute): Promise<Reel> {
    return this.bridge.call("reel", { reelId: route.highlightId });
  }
}
