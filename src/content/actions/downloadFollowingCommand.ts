// Downloads every account the signed-in viewer follows.
import type { FollowingRunner, JobRunner } from "../bulk/ports";
import type { Command, CurrentViewer, FollowingJobWording } from "./ports";

export class DownloadFollowingCommand implements Command {
  constructor(
    private readonly runner: JobRunner,
    private readonly following: FollowingRunner,
    private readonly viewers: CurrentViewer,
    private readonly wording: FollowingJobWording,
  ) {}

  run(): Promise<void> {
    return this.runner.run({
      title: this.wording.followingTitle(),
      run: async (folder, signal, reporter) => {
        const viewer = await this.viewers.current();
        if (viewer === undefined) throw new Error(this.wording.noViewer());
        return this.following.run({ viewer, folder, signal, reporter });
      },
    });
  }
}
