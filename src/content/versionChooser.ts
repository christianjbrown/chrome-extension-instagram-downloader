// Which of a media's versions is saved: a video over its cover picture, and
// the largest size of whichever it is.
import type { InstagramMedia, MediaVersion } from "../shared/media";
import type { VersionChooser } from "./ports";

const area = (version: MediaVersion): number => version.width * version.height;

function largestVersion(
  versions: readonly MediaVersion[],
): MediaVersion | undefined {
  return versions.reduce<MediaVersion | undefined>(
    (best, version) =>
      best === undefined || area(version) > area(best) ? version : best,
    undefined,
  );
}

export class LargestVersionChooser implements VersionChooser {
  url(media: InstagramMedia): string | undefined {
    const versions =
      media.video_versions ?? media.image_versions2?.candidates ?? [];
    return largestVersion(versions)?.url;
  }
}
