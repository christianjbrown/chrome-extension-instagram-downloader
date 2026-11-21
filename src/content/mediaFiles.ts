// Which files a post or story is saved as, and whose name they carry.
import {
  UNKNOWN_TAKEN_AT,
  type DownloadItem,
  type InstagramMedia,
} from "../shared/media";
import type { MediaFiles, VersionChooser } from "./ports";

/** Names the files of a post that does not say whose it is. */
const UNKNOWN_USERNAME = "unknown";

// One item per file: a carousel gives one per slide, each borrowing the
// post's owner and time when it has none of its own.
export class SlideFiles implements MediaFiles {
  constructor(private readonly versions: VersionChooser) {}

  items(
    media: InstagramMedia,
    fallbackUsername = UNKNOWN_USERNAME,
  ): DownloadItem[] {
    const username = media.user?.username ?? fallbackUsername;
    const takenAt = media.taken_at ?? UNKNOWN_TAKEN_AT;
    const slides = media.carousel_media ?? [media];
    return slides.flatMap((slide) => this.itemFor(slide, username, takenAt));
  }

  private itemFor(
    media: InstagramMedia,
    username: string,
    takenAt: number,
  ): DownloadItem[] {
    const url = this.versions.url(media);
    if (url === undefined) return [];
    const id = media.id ?? String(media.pk);
    const video =
      media.video_versions !== undefined ? ({ video: true } as const) : {};
    return [
      { id, username, takenAt: media.taken_at ?? takenAt, url, ...video },
    ];
  }
}
