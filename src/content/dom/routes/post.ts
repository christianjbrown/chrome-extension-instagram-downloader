// A post's own page: /p/code/, or /name/p/code/ when opened from a profile.
import type { RouteKind } from "../ports";
import type { Route } from "../route";

export const POST_KIND = "post";

export interface PostRoute {
  readonly kind: typeof POST_KIND;
  readonly shortcode: string;
}

export class PostPage implements RouteKind<PostRoute> {
  matches(route: Route): route is PostRoute {
    return route.kind === POST_KIND;
  }
}
