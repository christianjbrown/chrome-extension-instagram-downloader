import type { Reel } from "../../shared/bridge";
import type { Route } from "../dom/route";
import type { Bridge } from "../ports";
import type { StoryKind, StoryRoute } from "./ports";

type UserStoryRoute = Extract<Route, { kind: "story" }>;

// /stories/name/ and /stories/name/id/: one account's current stories.
export class UserStories implements StoryKind<UserStoryRoute> {
  constructor(private readonly bridge: Bridge) {}

  matches(route: StoryRoute): route is UserStoryRoute {
    return route.kind === "story";
  }

  mediaId(route: UserStoryRoute): string | undefined {
    return route.mediaId;
  }

  owner(route: UserStoryRoute): string | undefined {
    return route.username;
  }

  reel(route: UserStoryRoute): Promise<Reel> {
    return this.bridge.call("userReel", { username: route.username });
  }
}
