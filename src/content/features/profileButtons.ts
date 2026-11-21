// The buttons under a profile's header. The composition root lists them in
// the order they appear.
import type { Command, OwnProfile, UsernameCommand } from "../actions/ports";
import type { Viewer } from "../../shared/bridge";
import type { ResumableRun } from "../bulk/ports";
import type { ButtonLook, ProfileButton } from "./feature";

/** How the Download following button looks, for a new run and a stopped one. */
export interface FollowingLooks {
  readonly start: ButtonLook;
  readonly resume: ButtonLook;
}

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
    private readonly looks: FollowingLooks,
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
      ? this.looks.resume
      : this.looks.start;
  }

  run(): Promise<void> {
    return this.command.run();
  }
}
