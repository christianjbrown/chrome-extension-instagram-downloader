// One class per kind of page, each recognising its own routes, so nothing
// else needs to look at a route's kind.
import type { StoryRoute } from "../actions/ports";
import type { RouteKind } from "./ports";
import type { PostRoute, ProfileRoute, Route } from "./route";

export class PostPage implements RouteKind<PostRoute> {
  matches(route: Route): route is PostRoute {
    return route.kind === "post";
  }
}

export class ProfilePage implements RouteKind<ProfileRoute> {
  matches(route: Route): route is ProfileRoute {
    return route.kind === "profile";
  }
}

// Stories and highlights share the story viewer.
export class StoryPage implements RouteKind<StoryRoute> {
  matches(route: Route): route is StoryRoute {
    return route.kind === "story" || route.kind === "highlight";
  }
}
