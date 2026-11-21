import { TAGS } from "../../shared/dom";
import type { RouteReader } from "../dom/ports";
import type { ProfileRoute } from "../dom/route";
import { PROFILE_HEADER } from "../dom/selectors";
import { textButtonClass } from "../ui/buttons";
import { bySelector, CLASS } from "../ui/classNames";
import type { ButtonFactory } from "../ui/ports";
import type { ButtonLook, Feature, ProfileButton } from "./feature";

export interface ProfileToolbarDependencies {
  readonly document: Document;
  readonly profiles: RouteReader<ProfileRoute>;
  readonly buttons: ButtonFactory;
  /** The buttons, in the order they appear. */
  readonly profileButtons: readonly ProfileButton[];
}

// The row of links under a profile's header. Each button decides whether it
// belongs on the profile, some only once they have asked, so each takes its
// own place in the row whenever it is offered.
export class ProfileToolbar implements Feature {
  constructor(private readonly deps: ProfileToolbarDependencies) {}

  scan(): void {
    const route = this.deps.profiles.read();
    const header = this.deps.document.querySelector(PROFILE_HEADER);
    if (route === undefined || header === null) return;
    const existing = header.querySelector<HTMLElement>(
      bySelector(CLASS.profileToolbar),
    );
    if (existing?.dataset.username === route.username) return;
    existing?.remove();
    header.append(this.toolbar(route.username));
  }

  private toolbar(username: string): HTMLElement {
    const toolbar = this.deps.document.createElement(TAGS.div);
    toolbar.className = CLASS.profileToolbar;
    toolbar.dataset.username = username;
    const placed: (HTMLElement | undefined)[] = [];
    this.deps.profileButtons.forEach((button, index) => {
      button.offer(username, (look) => {
        const element = this.element(look, () => button.run(username));
        placed[index] = element;
        const next = placed.slice(index + 1).find((el) => el !== undefined);
        toolbar.insertBefore(element, next ?? null);
      });
    });
    return toolbar;
  }

  private element(look: ButtonLook, run: () => Promise<void>): HTMLElement {
    return this.deps.buttons.textButton({
      label: look.label,
      className: textButtonClass(look.icon),
      onClick: () => void run(),
    });
  }
}
