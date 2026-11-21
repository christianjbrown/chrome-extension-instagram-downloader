import type { Reel } from "../../shared/bridge";
import { HIGHLIGHT_KIND, type HighlightRoute } from "../dom/routes/highlight";
import type { Bridge } from "../ports";
import type { StoryRoute } from "../dom/route";
import type { StoryKind } from "./ports";

// /stories/highlights/id/: a saved highlight, whose address names neither
// the story showing nor whose it is.
export class HighlightStories implements StoryKind<HighlightRoute> {
  constructor(private readonly bridge: Bridge) {}

  matches(route: StoryRoute): route is HighlightRoute {
    return route.kind === HIGHLIGHT_KIND;
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
