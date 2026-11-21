import type { StoryRoute } from "../dom/route";

/** Something that adds its buttons to the page; run again whenever it changes. */
export interface Feature {
  scan(): void;
}

/** One button beside a post's bookmark. */
export interface PostButton {
  readonly label: string;
  readonly className: string;
  /** Saves every slide rather than the one showing. */
  readonly all: boolean;
  shows(container: ParentNode): boolean;
}

/** What a labelled button says, and the icon content.css draws for it. */
export interface ButtonLook {
  readonly icon: string;
  readonly label: string;
}

/** One button in the row under a profile's header. */
export interface ProfileButton {
  /**
   * Calls show with how the button looks on this profile, straight away or
   * once it knows, and never when the button does not belong there.
   */
  offer(username: string, show: (look: ButtonLook) => void): void;
  run(username: string): Promise<void>;
}

/** One button over the story viewer. */
export interface StoryButton {
  readonly look: ButtonLook;
  run(route: StoryRoute): Promise<void>;
}
