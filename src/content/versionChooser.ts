// Which of a media's versions is saved: a video over its cover picture, and
// the largest size of whichever it is.
import {
  imageVersions,
  type InstagramMedia,
  type MediaVersion,
} from "../shared/media";
import type { VersionChooser } from "./ports";

const area = (version: MediaVersion): number => version.width * version.height;

// The first of two the same size stays the largest.
const isLarger = (
  version: MediaVersion,
  best: MediaVersion | undefined,
): boolean => best === undefined || area(version) > area(best);

const larger = (
  best: MediaVersion | undefined,
  version: MediaVersion,
): MediaVersion | undefined => (isLarger(version, best) ? version : best);

const largestVersion = (
  versions: readonly MediaVersion[],
): MediaVersion | undefined =>
  versions.reduce<MediaVersion | undefined>(larger, undefined);

const versionsOf = (media: InstagramMedia): readonly MediaVersion[] =>
  media.video_versions ?? imageVersions(media);

export class LargestVersionChooser implements VersionChooser {
  url(media: InstagramMedia): string | undefined {
    return largestVersion(versionsOf(media))?.url;
  }
}
