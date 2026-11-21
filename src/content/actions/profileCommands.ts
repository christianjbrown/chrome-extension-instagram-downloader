// What the buttons on a profile do.
import type { Archiver } from "../bulk/accountArchiver";
import type { BulkJob, JobRunner } from "../bulk/bulkRunner";
import type { FollowingRunner } from "../bulk/followingDownloader";
import { describeCounts } from "../bulk/progressText";
import type { Bridge } from "../bridgeClient";
import { errorMessage } from "../errorText";
import type { FolderSource } from "../saving/folderPicker";
import type { ItemDownloader } from "../saving/fileDownloader";
import type { Notifier } from "../ui/notifier";
import { UNKNOWN_TAKEN_AT } from "../../shared/media";
import type { CurrentViewer } from "./viewerSource";

const text = {
  downloading: "Downloading",
  finished: "Finished",
  downloadingFollowing: "Downloading accounts you follow",
  noViewer: "Could not find your account.",
  noPicture: "no picture",
  pictureFailed: "Could not download the profile picture",
  folderUnchanged: "The download folder was not changed.",
} as const;

// Ends a profile picture's id, so its file cannot clash with a post's.
const profilePictureSuffix = "_profile";

/** A button's action that needs nothing more. */
export interface Command {
  run(): Promise<void>;
}

/** A button's action on the profile it sits on. */
export interface UsernameCommand {
  run(username: string): Promise<void>;
}

export class DownloadAccountCommand implements UsernameCommand {
  constructor(
    private readonly runner: JobRunner,
    private readonly archiver: Archiver,
  ) {}

  run(username: string): Promise<void> {
    const job: BulkJob = {
      title: `${text.downloading} ${username}`,
      run: async (folder, signal, reporter) => {
        reporter.heading(username);
        const counts = await this.archiver.archive({
          username,
          folder,
          onlyNew: false,
          signal,
          reporter,
        });
        return `${text.finished}: ${describeCounts(counts)}.`;
      },
    };
    return this.runner.run(job);
  }
}

export class DownloadFollowingCommand implements Command {
  constructor(
    private readonly runner: JobRunner,
    private readonly following: FollowingRunner,
    private readonly viewers: CurrentViewer,
  ) {}

  run(): Promise<void> {
    return this.runner.run({
      title: text.downloadingFollowing,
      run: async (folder, signal, reporter) => {
        const viewer = await this.viewers.current();
        if (viewer === undefined) throw new Error(text.noViewer);
        return this.following.run({ viewer, folder, signal, reporter });
      },
    });
  }
}

export class ProfilePictureCommand implements UsernameCommand {
  constructor(
    private readonly bridge: Bridge,
    private readonly downloader: ItemDownloader,
    private readonly notifier: Notifier,
  ) {}

  async run(username: string): Promise<void> {
    try {
      const account = await this.bridge.call("account", { username });
      if (account.profilePicUrl === undefined) throw new Error(text.noPicture);
      await this.downloader.download({
        id: `${account.id}${profilePictureSuffix}`,
        username,
        takenAt: UNKNOWN_TAKEN_AT,
        url: account.profilePicUrl,
      });
    } catch (error) {
      this.notifier.error(`${text.pictureFailed}: ${errorMessage(error)}`);
    }
  }
}

export class ChangeFolderCommand implements Command {
  constructor(
    private readonly folders: FolderSource,
    private readonly notifier: Notifier,
  ) {}

  async run(): Promise<void> {
    try {
      await this.folders.pick(true);
    } catch {
      this.notifier.error(text.folderUnchanged);
    }
  }
}
