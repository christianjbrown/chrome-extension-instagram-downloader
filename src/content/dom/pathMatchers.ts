// One matcher per kind of page, each recognising its own addresses.
import type { Route } from "./route";
import { HIGHLIGHT_KIND } from "./routes/highlight";
import { OTHER_ROUTE } from "./routes/other";
import { POST_KIND } from "./routes/post";
import { PROFILE_KIND } from "./routes/profile";
import { USER_STORY_KIND } from "./routes/userStory";
import type { PathMatcher } from "./ports";

/** The first segment of every story and highlight address. */
export const STORIES_SEGMENT = "stories";
const highlightsSegment = "highlights";

// Where the post prefix sits: first, or after the name of the profile the
// post was opened from.
const prefixFirst = 0;
const prefixAfterName = 1;

// /stories/name/id/, or /stories/highlights/id/ for a highlight.
export class StoryPath implements PathMatcher {
  match([first, owner, media]: readonly string[]): Route | undefined {
    return first === STORIES_SEGMENT ? this.story(owner, media) : undefined;
  }

  private story(owner: string | undefined, media: string | undefined): Route {
    return owner === undefined ? OTHER_ROUTE : this.owned(owner, media);
  }

  private owned(owner: string, media: string | undefined): Route {
    return owner === highlightsSegment
      ? this.highlight(media)
      : { kind: USER_STORY_KIND, username: owner, mediaId: media };
  }

  private highlight(media: string | undefined): Route {
    return media === undefined
      ? OTHER_ROUTE
      : { kind: HIGHLIGHT_KIND, highlightId: media };
  }
}

// /p/code/, or /name/p/code/ for a post opened from a profile.
// The prefixes, one per kind of post, are passed in.
export class PostPath implements PathMatcher {
  constructor(private readonly prefixes: ReadonlySet<string>) {}

  match(segments: readonly string[]): Route | undefined {
    const [first] = segments;
    return first === undefined
      ? undefined
      : this.fromPrefix(segments, this.start(first));
  }

  private start(first: string): number {
    return this.prefixes.has(first) ? prefixFirst : prefixAfterName;
  }

  private fromPrefix(
    segments: readonly string[],
    start: number,
  ): Route | undefined {
    return this.isPrefix(segments[start])
      ? this.post(segments[start + 1])
      : undefined;
  }

  private isPrefix(segment: string | undefined): boolean {
    return segment !== undefined && this.prefixes.has(segment);
  }

  private post(shortcode: string | undefined): Route | undefined {
    return shortcode ? { kind: POST_KIND, shortcode } : undefined;
  }
}

// /name/, as long as the name is not one of Instagram's own pages, which are
// passed in.
export class ProfilePath implements PathMatcher {
  constructor(private readonly reserved: ReadonlySet<string>) {}

  match([first, ...rest]: readonly string[]): Route | undefined {
    return rest.length === 0 ? this.profile(first) : undefined;
  }

  private profile(first: string | undefined): Route | undefined {
    return this.isAccountName(first)
      ? { kind: PROFILE_KIND, username: first }
      : undefined;
  }

  private isAccountName(segment: string | undefined): segment is string {
    return segment !== undefined && !this.reserved.has(segment);
  }
}
