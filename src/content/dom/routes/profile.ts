// An account's profile: /name/.
import type { RouteKind } from "../ports";
import type { Route } from "../route";

export const PROFILE_KIND = "profile";

export interface ProfileRoute {
  readonly kind: typeof PROFILE_KIND;
  readonly username: string;
}

export class ProfilePage implements RouteKind<ProfileRoute> {
  matches(route: Route): route is ProfileRoute {
    return route.kind === PROFILE_KIND;
  }
}
