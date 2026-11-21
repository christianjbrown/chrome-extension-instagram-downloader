import css from "../../../static/content.css?raw";
import { BUTTON_LOOKS } from "../../../src/content/featureWiring";
import { GRID_LINK_CLASS } from "../../../src/content/dom/gridThumbnails";
import { GRID_BUTTON_CLASS } from "../../../src/content/features/gridButtons";
import { POST_ACTIONS_CLASS } from "../../../src/content/features/postActions";
import {
  DOWNLOAD_ALL_CLASS,
  DOWNLOAD_CLASS,
} from "../../../src/content/features/postButtons";
import { PROFILE_TOOLBAR_CLASS } from "../../../src/content/features/profileToolbar";
import { STORY_TOOLBAR_CLASS } from "../../../src/content/features/storyToolbar";
import {
  ICON_CLASS_PREFIX,
  TEXT_BUTTON_CLASS,
} from "../../../src/content/ui/buttons";
import {
  BUTTON_CLASS,
  bySelector,
  classes,
} from "../../../src/content/ui/classNames";
import {
  PANEL_BUTTON_CLASS,
  PANEL_CLASS,
} from "../../../src/content/ui/domPanelView";
import { TOAST_CLASS } from "../../../src/content/ui/notifier";

const styled = (name: string): boolean => css.includes(bySelector(name));

describe("class names", () => {
  it("names only classes content.css styles", () => {
    for (const name of [
      BUTTON_CLASS,
      DOWNLOAD_CLASS,
      DOWNLOAD_ALL_CLASS,
      GRID_LINK_CLASS,
      GRID_BUTTON_CLASS,
      POST_ACTIONS_CLASS,
      PROFILE_TOOLBAR_CLASS,
      STORY_TOOLBAR_CLASS,
      TEXT_BUTTON_CLASS,
      ICON_CLASS_PREFIX,
      PANEL_CLASS,
      PANEL_BUTTON_CLASS,
      TOAST_CLASS,
    ])
      expect(styled(name)).toBe(true);
  });

  it("has an icon drawn for every labelled button's look", () => {
    for (const { icon } of Object.values(BUTTON_LOOKS))
      expect(styled(`${ICON_CLASS_PREFIX}${icon}`)).toBe(true);
  });

  it("joins classes the way className takes them", () => {
    expect(classes(BUTTON_CLASS, DOWNLOAD_CLASS)).toBe(
      "igdl-button igdl-download",
    );
  });
});
