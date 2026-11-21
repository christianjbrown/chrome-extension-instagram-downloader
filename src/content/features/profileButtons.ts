// The buttons under a profile's header. The composition root lists them in
// the order they appear.
import type { Command, OwnProfile, UsernameCommand } from "../actions/ports";
import type { Viewer } from "../../shared/bridge";
import type { ResumableRun } from "../bulk/ports";
import type { ButtonLook, ProfileButton } from "./feature";

/** How the buttons every profile gets look. */
export const PROFILE_BUTTON_LOOKS = {
  downloadAll: { icon: "download-all", label: "Download all posts" },
  picture: { icon: "picture", label: "Download profile picture" },
  folder: { icon: "folder", label: "Change download folder" },
} as const satisfies Record<string, ButtonLook>;

const following = {
  start: { icon: "following", label: "Download following" },
  resume: { icon: "following", label: "Resume downloading following" },
} as const satisfies Record<string, ButtonLook>;

/** A button on every profile that runs one command for it. */
export class CommandButton implements ProfileButton {
  constructor(
    private readonly appearance: ButtonLook,
    private readonly command: UsernameCommand,
  ) {}

  offer(_username: string, show: (look: ButtonLook) => void): void {
    show(this.appearance);
  }

  run(username: string): Promise<void> {
    return this.command.run(username);
  }
}

/** Download following, on your own profile only, offering to resume a stopped run. */
export class FollowingButton implements ProfileButton {
  constructor(
    private readonly command: Command,
    private readonly ownProfile: OwnProfile,
    private readonly resumable: ResumableRun,
  ) {}

  offer(username: string, show: (look: ButtonLook) => void): void {
    void this.look(username).then((look) => {
      if (look !== undefined) show(look);
    });
  }

  private async look(username: string): Promise<ButtonLook | undefined> {
    const viewer = await this.ownProfile.viewerOn(username);
    return viewer === undefined ? undefined : this.lookFor(viewer);
  }

  // A run stopped part way is offered to carry on.
  private async lookFor(viewer: Viewer): Promise<ButtonLook> {
    return (await this.resumable.canResume(viewer))
      ? following.resume
      : following.start;
  }

  run(): Promise<void> {
    return this.command.run();
  }
}
