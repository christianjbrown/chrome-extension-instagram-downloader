// What the buttons on a profile do.
import type { AccountArchiver } from "../bulk/accountArchiver";
import type { BulkJob, BulkRunner } from "../bulk/bulkRunner";
import type { FollowingDownloader } from "../bulk/followingDownloader";
import { describeCounts } from "../bulk/progressText";
import type { Bridge } from "../bridgeClient";
import { errorMessage } from "../errors";
import type { FolderSource } from "../saving/folderPicker";
import type { ItemDownloader } from "../saving/fileDownloader";
import type { Notifier } from "../ui/notifier";
import type { ViewerSource } from "./viewerSource";

export class DownloadAccountCommand {
  constructor(
    private readonly runner: BulkRunner,
    private readonly archiver: AccountArchiver,
  ) {}

  run(username: string): Promise<void> {
    const job: BulkJob = {
      title: `Downloading ${username}`,
      run: async (folder, signal, reporter) => {
        reporter.heading(username);
        const counts = await this.archiver.archive({
          username,
          folder,
          onlyNew: false,
          signal,
          reporter,
        });
        return `Finished: ${describeCounts(counts)}.`;
      },
    };
    return this.runner.run(job);
  }
}

export class DownloadFollowingCommand {
  constructor(
    private readonly runner: BulkRunner,
    private readonly following: FollowingDownloader,
    private readonly viewers: ViewerSource,
  ) {}

  run(): Promise<void> {
    return this.runner.run({
      title: "Downloading accounts you follow",
      run: async (folder, signal, reporter) => {
        const viewer = await this.viewers.current();
        if (viewer === undefined)
          throw new Error("Could not find your account.");
        return this.following.run({ viewer, folder, signal, reporter });
      },
    });
  }
}

export class ProfilePictureCommand {
  constructor(
    private readonly bridge: Bridge,
    private readonly downloader: ItemDownloader,
    private readonly notifier: Notifier,
  ) {}

  async run(username: string): Promise<void> {
    try {
      const account = await this.bridge.call("account", { username });
      if (account.profilePicUrl === undefined) throw new Error("no picture");
      await this.downloader.download({
        id: `${account.id}_profile`,
        username,
        takenAt: 0,
        url: account.profilePicUrl,
      });
    } catch (error) {
      this.notifier.error(
        `Could not download the profile picture: ${errorMessage(error)}`,
      );
    }
  }
}

export class ChangeFolderCommand {
  constructor(
    private readonly folders: FolderSource,
    private readonly notifier: Notifier,
  ) {}

  async run(): Promise<void> {
    try {
      await this.folders.pick(true);
    } catch {
      this.notifier.error("The download folder was not changed.");
    }
  }
}
