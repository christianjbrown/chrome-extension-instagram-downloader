// What the buttons on a profile do.
import type {
  Archiver,
  BulkJob,
  CountsWording,
  JobRunner,
  FollowingRunner,
} from "../bulk/ports";
import type { Bridge, ErrorDescriber } from "../ports";
import type { FolderSource, ItemDownloader } from "../saving/ports";
import type { Notifier } from "../ui/ports";
import type { CurrentViewer, Command, UsernameCommand } from "./ports";
import type { Account } from "../../shared/bridge";
import { UNKNOWN_TAKEN_AT } from "../../shared/media";

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

export class DownloadAccountCommand implements UsernameCommand {
  constructor(
    private readonly runner: JobRunner,
    private readonly archiver: Archiver,
    private readonly wording: CountsWording,
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
        return `${text.finished}: ${this.wording.counts(counts)}.`;
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

function pictureOf(account: Account): string {
  if (account.profilePicUrl === undefined) throw new Error(text.noPicture);
  return account.profilePicUrl;
}

export class ProfilePictureCommand implements UsernameCommand {
  constructor(
    private readonly bridge: Bridge,
    private readonly downloader: ItemDownloader,
    private readonly notifier: Notifier,
    private readonly errors: ErrorDescriber,
  ) {}

  async run(username: string): Promise<void> {
    try {
      await this.save(username);
    } catch (error) {
      this.notifier.error(
        `${text.pictureFailed}: ${this.errors.describe(error)}`,
      );
    }
  }

  private async save(username: string): Promise<void> {
    const account = await this.bridge.call("account", { username });
    await this.downloader.download({
      id: `${account.id}${profilePictureSuffix}`,
      username,
      takenAt: UNKNOWN_TAKEN_AT,
      url: pictureOf(account),
    });
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
