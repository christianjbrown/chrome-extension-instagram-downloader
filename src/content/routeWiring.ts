// Builds the readers of the address, one per kind of page a feature looks
// for.
import { AddressRoute } from "./dom/addressRoute";
import {
  PostPath,
  ProfilePath,
  STORIES_SEGMENT,
  StoryPath,
} from "./dom/pathMatchers";
import type { PathMatcher, RouteReader } from "./dom/ports";
import type { StoryRoute } from "./dom/route";
import { PathRouteParser } from "./dom/routeParser";
import { AnyRouteKind } from "./dom/routeKinds";
import { HighlightPage } from "./dom/routes/highlight";
import { PostPage, type PostRoute } from "./dom/routes/post";
import { ProfilePage, type ProfileRoute } from "./dom/routes/profile";
import { UserStoryPage } from "./dom/routes/userStory";

/** The page the address shows, read for each kind of page. */
export interface Routes {
  readonly posts: RouteReader<PostRoute>;
  readonly profiles: RouteReader<ProfileRoute>;
  readonly stories: RouteReader<StoryRoute>;
}

// The first segment of a post's address, one per kind of post.
const POST_PREFIXES: ReadonlySet<string> = new Set(["p", "reel", "tv"]);

// First segments that are Instagram's own pages rather than an account.
const RESERVED_FIRST_SEGMENTS: ReadonlySet<string> = new Set([
  "accounts",
  "direct",
  "explore",
  "reels",
  STORIES_SEGMENT,
  ...POST_PREFIXES,
]);

/**
 * Every kind of address, tried in this order, so a story or post address is
 * never read as a profile.
 */
export function pathMatchers(): PathMatcher[] {
  return [
    new StoryPath(),
    new PostPath(POST_PREFIXES),
    new ProfilePath(RESERVED_FIRST_SEGMENTS),
  ];
}

export function routes(pathname: () => string): Routes {
  const parser = new PathRouteParser(pathMatchers());
  // Stories and highlights share the story viewer.
  const stories = new AnyRouteKind<StoryRoute>([
    new UserStoryPage(),
    new HighlightPage(),
  ]);
  return {
    posts: new AddressRoute(pathname, parser, new PostPage()),
    profiles: new AddressRoute(pathname, parser, new ProfilePage()),
    stories: new AddressRoute(pathname, parser, stories),
  };
}
