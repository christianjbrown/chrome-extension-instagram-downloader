// Builds the readers of the address, one per kind of page a feature looks
// for.
import { AddressRoute } from "./dom/addressRoute";
import { PostPath, ProfilePath, StoryPath } from "./dom/pathMatchers";
import type { RouteReader } from "./dom/ports";
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

export function routes(pathname: () => string): Routes {
  // Tried in this order, so a story or post address is never read as a
  // profile.
  const parser = new PathRouteParser([
    new StoryPath(),
    new PostPath(),
    new ProfilePath(),
  ]);
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
