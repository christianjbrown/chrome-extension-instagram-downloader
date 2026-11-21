// The words of the buttons on a profile, in English.
import type {
  AccountJobWording,
  FolderWording,
  FollowingJobWording,
  PictureWording,
} from "./ports";

export class EnglishProfileWording
  implements
    AccountJobWording,
    FollowingJobWording,
    PictureWording,
    FolderWording
{
  accountTitle(username: string): string {
    return `Downloading ${username}`;
  }

  accountFinished(counts: string): string {
    return `Finished: ${counts}.`;
  }

  followingTitle(): string {
    return "Downloading accounts you follow";
  }

  noViewer(): string {
    return "Could not find your account.";
  }

  noPicture(): string {
    return "no picture";
  }

  pictureFailed(reason: string): string {
    return `Could not download the profile picture: ${reason}`;
  }

  folderUnchanged(): string {
    return "The download folder was not changed.";
  }
}
