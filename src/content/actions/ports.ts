// What a button's action is, as the features see it.
import type { Reel, Viewer } from "../../shared/bridge";
import type { ROUTE_KINDS, Route } from "../dom/route";

/** A post found by id, optionally one slide of it, or by the picture on screen. */
export type PostTarget =
  | { readonly mediaId: string; readonly slide: number | undefined }
  | { readonly asset: string };

export interface PostDownloads {
  /** `owner` names the files when the post itself does not say whose it is. */
  download(target: PostTarget, owner?: string): Promise<void>;
}

export type StoryRoute = Extract<
  Route,
  { kind: typeof ROUTE_KINDS.story | typeof ROUTE_KINDS.highlight }
>;

/** One kind of story page, and how to read the stories it shows. */
export interface StoryKind<R extends StoryRoute> {
  matches(route: StoryRoute): route is R;
  /** The id of the story showing, when the address names it. */
  mediaId(route: R): string | undefined;
  /** Whose stories these are, when the address says. */
  owner(route: R): string | undefined;
  /** Every story on the page. */
  reel(route: R): Promise<Reel>;
}

export interface StoryDownloads {
  /** The story showing, found by its id or by the picture on screen. */
  current(route: StoryRoute, asset: string | undefined): Promise<void>;
  /** Every story in the reel or highlight. */
  all(route: StoryRoute): Promise<void>;
}

export interface CurrentViewer {
  current(): Promise<Viewer | undefined>;
}

/** A button's action that needs nothing more. */
export interface Command {
  run(): Promise<void>;
}

/** A button's action on the profile it sits on. */
export interface UsernameCommand {
  run(username: string): Promise<void>;
}

/** Tells whether a profile is the signed-in account's own. */
export interface OwnProfile {
  /** The signed-in account when the profile is its own, otherwise undefined. */
  viewerOn(username: string): Promise<Viewer | undefined>;
}
