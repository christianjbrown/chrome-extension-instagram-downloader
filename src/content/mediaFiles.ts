// Which files a post or story is saved as, and whose name they carry.
import {
  UNKNOWN_TAKEN_AT,
  type DownloadItem,
  type InstagramMedia,
} from "../shared/media";
import type { MediaFiles, VersionChooser } from "./ports";

/** Names the files of a post that does not say whose it is. */
const UNKNOWN_USERNAME = "unknown";

const ownerName = (media: InstagramMedia): string | undefined =>
  media.user?.username;

const nameOr = (owner: string | undefined): string => owner ?? UNKNOWN_USERNAME;

// The media's own owner first, then the one the caller names.
const usernameOf = (media: InstagramMedia, owner: string | undefined): string =>
  ownerName(media) ?? nameOr(owner);

const takenAtOf = (media: InstagramMedia, fallback: number): number =>
  media.taken_at ?? fallback;

const slidesOf = (media: InstagramMedia): readonly InstagramMedia[] =>
  media.carousel_media ?? [media];

const idOf = (media: InstagramMedia): string => media.id ?? String(media.pk);

const videoMark = (media: InstagramMedia): { video?: true } =>
  media.video_versions !== undefined ? { video: true } : {};

function itemOf(
  media: InstagramMedia,
  url: string,
  username: string,
  takenAt: number,
): DownloadItem {
  return {
    id: idOf(media),
    username,
    takenAt: takenAtOf(media, takenAt),
    url,
    ...videoMark(media),
  };
}

// One item per file: a carousel gives one per slide, each borrowing the
// post's owner and time when it has none of its own.
export class SlideFiles implements MediaFiles {
  constructor(private readonly versions: VersionChooser) {}

  items(media: InstagramMedia, owner?: string): DownloadItem[] {
    const username = usernameOf(media, owner);
    const takenAt = takenAtOf(media, UNKNOWN_TAKEN_AT);
    return slidesOf(media).flatMap((slide) =>
      this.itemFor(slide, username, takenAt),
    );
  }

  private itemFor(
    media: InstagramMedia,
    username: string,
    takenAt: number,
  ): DownloadItem[] {
    const url = this.versions.url(media);
    return url === undefined ? [] : [itemOf(media, url, username, takenAt)];
  }
}
