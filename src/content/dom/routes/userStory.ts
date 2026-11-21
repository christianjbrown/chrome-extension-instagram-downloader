// One account's current stories: /stories/name/ and /stories/name/id/.
import type { RouteKind } from "../ports";
import type { Route } from "../route";

export const USER_STORY_KIND = "story";

export interface UserStoryRoute {
  readonly kind: typeof USER_STORY_KIND;
  readonly username: string;
  readonly mediaId: string | undefined;
}

export class UserStoryPage implements RouteKind<UserStoryRoute> {
  matches(route: Route): route is UserStoryRoute {
    return route.kind === USER_STORY_KIND;
  }
}
