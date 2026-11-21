import { TAGS, type ElementMaker } from "../../shared/dom";
import type { RouteReader } from "../dom/ports";
import type { ProfileRoute } from "../dom/routes/profile";
import { PROFILE_HEADER } from "../dom/selectors";
import { textButtonClass } from "../ui/buttons";
import { bySelector } from "../ui/classNames";
import type { TextButtons } from "../ui/ports";
import type { ButtonLook, Feature, ProfileButton } from "./feature";

// Marks the row of buttons under a profile header, for content.css and for
// finding it again.
export const PROFILE_TOOLBAR_CLASS = "igdl-profile-toolbar";

// The toolbar names the profile it was made for.
const usernameAttribute = "data-username";

const isFor = (toolbar: Element | null, username: string): boolean =>
  toolbar?.getAttribute(usernameAttribute) === username;

export interface ProfileToolbarDependencies {
  readonly document: ElementMaker & Pick<ParentNode, "querySelector">;
  readonly profiles: RouteReader<ProfileRoute>;
  readonly buttons: TextButtons;
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
    if (route !== undefined) this.showOn(route.username);
  }

  private showOn(username: string): void {
    const header = this.deps.document.querySelector(PROFILE_HEADER);
    if (header !== null) this.refresh(header, username);
  }

  // A toolbar left from another profile is swapped for this one's.
  private refresh(header: Element, username: string): void {
    const existing = header.querySelector(bySelector(PROFILE_TOOLBAR_CLASS));
    if (!isFor(existing, username)) this.replace(header, existing, username);
  }

  private replace(
    header: Element,
    existing: Element | null,
    username: string,
  ): void {
    existing?.remove();
    header.append(this.toolbar(username));
  }

  private toolbar(username: string): HTMLElement {
    const toolbar = this.deps.document.createElement(TAGS.div);
    toolbar.className = PROFILE_TOOLBAR_CLASS;
    toolbar.setAttribute(usernameAttribute, username);
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
