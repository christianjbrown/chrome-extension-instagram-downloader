// One matcher per kind of page, each recognising its own addresses.
import { OTHER_ROUTE, ROUTE_KINDS, type Route } from "./route";
import type { PathMatcher } from "./ports";

const storiesSegment = "stories";
const highlightsSegment = "highlights";

const postPrefixes = new Set(["p", "reel", "tv"]);

// First segments that are Instagram's own pages rather than an account.
const reservedFirstSegments = new Set([
  "accounts",
  "direct",
  "explore",
  "reels",
  storiesSegment,
  ...postPrefixes,
]);

// /stories/name/id/, or /stories/highlights/id/ for a highlight.
export class StoryPath implements PathMatcher {
  match([first, owner, media]: readonly string[]): Route | undefined {
    if (first !== storiesSegment) return undefined;
    if (owner === undefined) return OTHER_ROUTE;
    if (owner !== highlightsSegment)
      return { kind: ROUTE_KINDS.story, username: owner, mediaId: media };
    return media === undefined
      ? OTHER_ROUTE
      : { kind: ROUTE_KINDS.highlight, highlightId: media };
  }
}

// /p/code/, or /name/p/code/ for a post opened from a profile.
export class PostPath implements PathMatcher {
  match(segments: readonly string[]): Route | undefined {
    const [first] = segments;
    if (first === undefined) return undefined;
    const start = postPrefixes.has(first) ? 0 : 1;
    const prefix = segments[start];
    const shortcode = segments[start + 1];
    return prefix !== undefined && postPrefixes.has(prefix) && shortcode
      ? { kind: ROUTE_KINDS.post, shortcode }
      : undefined;
  }
}

// /name/, as long as the name is not one of Instagram's own pages.
export class ProfilePath implements PathMatcher {
  match([first, ...rest]: readonly string[]): Route | undefined {
    return first !== undefined &&
      rest.length === 0 &&
      !reservedFirstSegments.has(first)
      ? { kind: ROUTE_KINDS.profile, username: first }
      : undefined;
  }
}
