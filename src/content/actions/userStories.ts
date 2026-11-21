import type { Reel } from "../../shared/bridge";
import { USER_STORY_KIND, type UserStoryRoute } from "../dom/routes/userStory";
import type { Bridge } from "../ports";
import type { StoryRoute } from "../dom/route";
import type { StoryKind } from "./ports";

// /stories/name/ and /stories/name/id/: one account's current stories.
export class UserStories implements StoryKind<UserStoryRoute> {
  constructor(private readonly bridge: Bridge) {}

  matches(route: StoryRoute): route is UserStoryRoute {
    return route.kind === USER_STORY_KIND;
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
