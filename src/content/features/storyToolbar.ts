import { TAGS } from "../../shared/dom";
import type { StoryRoute } from "../dom/route";
import type { RouteReader } from "../dom/ports";
import { bySelector } from "../ui/classNames";
import { textButtonClass } from "../ui/buttons";
import type { TextButtons } from "../ui/ports";
import type { Feature, StoryButton } from "./feature";

// Marks the buttons over the story viewer, for content.css and for finding
// them again.
export const STORY_TOOLBAR_CLASS = "igdl-story-toolbar";

export interface StoryToolbarDependencies {
  readonly document: Document;
  readonly stories: RouteReader<StoryRoute>;
  readonly buttons: TextButtons;
  /** The buttons, in the order they appear. */
  readonly storyButtons: readonly StoryButton[];
}

// Download buttons floating over the story viewer, for stories and highlights.
export class StoryToolbar implements Feature {
  constructor(private readonly deps: StoryToolbarDependencies) {}

  scan(): void {
    const existing = this.deps.document.querySelector(
      bySelector(STORY_TOOLBAR_CLASS),
    );
    if (this.deps.stories.read() === undefined) this.remove(existing);
    else this.show(existing);
  }

  private remove(existing: Element | null): void {
    existing?.remove();
  }

  private show(existing: Element | null): void {
    if (existing === null) this.deps.document.body.append(this.toolbar());
  }

  private toolbar(): HTMLElement {
    const toolbar = this.deps.document.createElement(TAGS.div);
    toolbar.className = STORY_TOOLBAR_CLASS;
    for (const button of this.deps.storyButtons)
      toolbar.append(this.element(button));
    return toolbar;
  }

  private element(button: StoryButton): HTMLElement {
    return this.deps.buttons.textButton({
      label: button.look.label,
      className: textButtonClass(button.look.icon),
      onClick: () => {
        const route = this.deps.stories.read();
        if (route !== undefined) void button.run(route);
      },
    });
  }
}
