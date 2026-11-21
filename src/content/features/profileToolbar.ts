import { TAGS } from "../../shared/dom";
import type { Command, UsernameCommand, CurrentViewer } from "../actions/ports";
import type { RunProgress } from "../bulk/ports";
import { PROFILE_HEADER } from "../dom/selectors";
import { bySelector, CLASS } from "../ui/classNames";
import { textButtonClass, type ButtonIcon } from "../ui/buttons";
import type { ButtonFactory } from "../ui/ports";
import type { RouteReader } from "../dom/ports";
import type { ProfileRoute } from "../dom/route";
import type { Feature } from "./feature";

const text = {
  downloadAll: "Download all posts",
  picture: "Download profile picture",
  folder: "Change download folder",
  resumeFollowing: "Resume downloading following",
  following: "Download following",
} as const;

export interface ProfileCommands {
  readonly account: UsernameCommand;
  readonly following: Command;
  readonly picture: UsernameCommand;
  readonly folder: Command;
}

interface ToolbarButton {
  readonly icon: ButtonIcon;
  readonly label: string;
  readonly run: (commands: ProfileCommands, username: string) => Promise<void>;
}

// The buttons every profile gets, in order. Download following is added
// after them, on your own profile only.
const toolbarButtons: readonly ToolbarButton[] = [
  {
    icon: "download-all",
    label: text.downloadAll,
    run: (commands, username) => commands.account.run(username),
  },
  {
    icon: "picture",
    label: text.picture,
    run: (commands, username) => commands.picture.run(username),
  },
  {
    icon: "folder",
    label: text.folder,
    run: (commands) => commands.folder.run(),
  },
];

// The row of links under a profile's header. Download following only shows
// on your own profile.
export interface ProfileToolbarDependencies {
  readonly document: Document;
  readonly commands: ProfileCommands;
  readonly viewers: CurrentViewer;
  readonly runs: RunProgress;
  readonly profiles: RouteReader<ProfileRoute>;
  readonly buttons: ButtonFactory;
}

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
    for (const { icon, label, run } of toolbarButtons)
      this.add(toolbar, icon, label, () => run(this.deps.commands, username));
    void this.addFollowing(toolbar, username);
    return toolbar;
  }

  private add(
    toolbar: HTMLElement,
    icon: ButtonIcon,
    label: string,
    run: () => Promise<void>,
  ): void {
    toolbar.append(
      this.deps.buttons.textButton({
        label,
        className: textButtonClass(icon),
        onClick: () => void run(),
      }),
    );
  }

  private async addFollowing(
    toolbar: HTMLElement,
    username: string,
  ): Promise<void> {
    const viewer = await this.deps.viewers.current();
    if (viewer?.username !== username) return;
    const label = (await this.deps.runs.inProgress(viewer.id))
      ? text.resumeFollowing
      : text.following;
    this.add(toolbar, "following", label, () =>
      this.deps.commands.following.run(),
    );
  }
}
