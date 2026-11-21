// Saves the full-size picture of the profile the button sits on.
import type { Bridge, ErrorDescriber } from "../ports";
import type { ItemDownloader } from "../saving/ports";
import type { Notifier } from "../ui/ports";
import type { PictureWording, UsernameCommand } from "./ports";
import type { Account } from "../../shared/bridge";
import { UNKNOWN_TAKEN_AT } from "../../shared/media";

// Ends a profile picture's id, so its file cannot clash with a post's.
const profilePictureSuffix = "_profile";

/** What the command needs to save and report a picture. */
export interface PictureParts {
  readonly bridge: Bridge;
  readonly downloader: ItemDownloader;
  readonly notifier: Notifier;
  readonly errors: ErrorDescriber;
}

export class ProfilePictureCommand implements UsernameCommand {
  constructor(
    private readonly parts: PictureParts,
    private readonly wording: PictureWording,
  ) {}

  async run(username: string): Promise<void> {
    try {
      await this.save(username);
    } catch (error) {
      this.parts.notifier.error(
        this.wording.pictureFailed(this.parts.errors.describe(error)),
      );
    }
  }

  private async save(username: string): Promise<void> {
    const account = await this.parts.bridge.call("account", { username });
    await this.parts.downloader.download({
      id: `${account.id}${profilePictureSuffix}`,
      username,
      takenAt: UNKNOWN_TAKEN_AT,
      url: this.pictureOf(account),
    });
  }

  private pictureOf(account: Account): string {
    if (account.profilePicUrl === undefined)
      throw new Error(this.wording.noPicture());
    return account.profilePicUrl;
  }
}
