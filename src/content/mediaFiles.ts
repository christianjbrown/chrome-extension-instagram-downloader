// Which files a post or story is saved as, and whose name they carry.
import {
  bestUrl,
  UNKNOWN_TAKEN_AT,
  type DownloadItem,
  type InstagramMedia,
} from "../shared/media";
import type { MediaFiles } from "./ports";

/** Names the files of a post that does not say whose it is. */
const UNKNOWN_USERNAME = "unknown";

function itemFor(
  media: InstagramMedia,
  username: string,
  takenAt: number,
): DownloadItem[] {
  const url = bestUrl(media);
  if (url === undefined) return [];
  const id = media.id ?? String(media.pk);
  const video =
    media.video_versions !== undefined ? ({ video: true } as const) : {};
  return [{ id, username, takenAt: media.taken_at ?? takenAt, url, ...video }];
}

// One item per file: a carousel gives one per slide, each borrowing the
// post's owner and time when it has none of its own.
export class SlideFiles implements MediaFiles {
  items(
    media: InstagramMedia,
    fallbackUsername = UNKNOWN_USERNAME,
  ): DownloadItem[] {
    const username = media.user?.username ?? fallbackUsername;
    const takenAt = media.taken_at ?? UNKNOWN_TAKEN_AT;
    const slides = media.carousel_media ?? [media];
    return slides.flatMap((slide) => itemFor(slide, username, takenAt));
  }
}
