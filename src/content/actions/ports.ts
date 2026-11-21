// What a button's action is, as the features see it.
import type { Viewer } from "../../shared/bridge";
import type { Route } from "../dom/route";

/** A post found by id, optionally one slide of it, or by the picture on screen. */
export type PostTarget =
  | { readonly mediaId: string; readonly slide: number | undefined }
  | { readonly asset: string };

export interface PostDownloads {
  /** `owner` names the files when the post itself does not say whose it is. */
  download(target: PostTarget, owner?: string): Promise<void>;
}

export type StoryRoute = Extract<Route, { kind: "story" | "highlight" }>;

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
