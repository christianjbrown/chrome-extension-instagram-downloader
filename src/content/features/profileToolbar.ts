import type {
  ChangeFolderCommand,
  DownloadAccountCommand,
  DownloadFollowingCommand,
  ProfilePictureCommand,
} from "../actions/profileCommands";
import type { ViewerSource } from "../actions/viewerSource";
import type { RunStore } from "../bulk/runStore";
import { parseRoute } from "../dom/route";
import { PROFILE_HEADER } from "../dom/selectors";
import { bySelector, CLASS } from "../ui/classNames";
import {
  createTextButton,
  textButtonClass,
  type ButtonIcon,
} from "../ui/buttons";
import type { Feature, PageView } from "./feature";

const text = {
  downloadAll: "Download all posts",
  picture: "Download profile picture",
  folder: "Change download folder",
  resumeFollowing: "Resume downloading following",
  following: "Download following",
} as const;

export interface ProfileCommands {
  readonly account: DownloadAccountCommand;
  readonly following: DownloadFollowingCommand;
  readonly picture: ProfilePictureCommand;
  readonly folder: ChangeFolderCommand;
}

// The row of links under a profile's header. Download following only shows
// on your own profile.
export class ProfileToolbar implements Feature {
  constructor(
    private readonly view: PageView,
    private readonly commands: ProfileCommands,
    private readonly viewers: ViewerSource,
    private readonly runs: RunStore,
  ) {}

  scan(): void {
    const route = parseRoute(this.view.pathname());
    const header = this.view.document.querySelector(PROFILE_HEADER);
    if (route.kind !== "profile" || header === null) return;
    const existing = header.querySelector<HTMLElement>(
      bySelector(CLASS.profileToolbar),
    );
    if (existing?.dataset.username === route.username) return;
    existing?.remove();
    header.append(this.toolbar(route.username));
  }

  private toolbar(username: string): HTMLElement {
    const toolbar = this.view.document.createElement("div");
    toolbar.className = CLASS.profileToolbar;
    toolbar.dataset.username = username;
    const { account, picture, folder } = this.commands;
    this.add(toolbar, "download-all", text.downloadAll, () =>
      account.run(username),
    );
    this.add(toolbar, "picture", text.picture, () => picture.run(username));
    this.add(toolbar, "folder", text.folder, () => folder.run());
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
      createTextButton(this.view.document, {
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
    const viewer = await this.viewers.current();
    if (viewer?.username !== username) return;
    const label = (await this.runs.inProgress(viewer.id))
      ? text.resumeFollowing
      : text.following;
    this.add(toolbar, "following", label, () => this.commands.following.run());
  }
}
