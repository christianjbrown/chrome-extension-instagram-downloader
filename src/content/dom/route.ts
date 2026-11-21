// Every kind of Instagram page a path can be. Each kind is declared in its
// own module under routes, so a new kind is one more line here.
import type { HighlightRoute } from "./routes/highlight";
import type { OtherRoute } from "./routes/other";
import type { PostRoute } from "./routes/post";
import type { ProfileRoute } from "./routes/profile";
import type { UserStoryRoute } from "./routes/userStory";

export type Route =
  PostRoute | ProfileRoute | UserStoryRoute | HighlightRoute | OtherRoute;

/** The pages the story viewer shows. */
export type StoryRoute = UserStoryRoute | HighlightRoute;
