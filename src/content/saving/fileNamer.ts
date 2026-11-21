import type { DownloadItem } from "../../shared/media";
import type { FileNamer } from "./ports";

const extensionPattern = /\.([0-9a-z]+)(?:[?#]|$)/i;
const knownExtensions: ReadonlySet<string> = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "mp4",
]);
const videoExtension = "mp4";
const imageExtension = "jpg";

// Only extensions Instagram really serves; anything else gets the usual one
// for the kind of file.
const foundExtension = (url: string): string | undefined =>
  extensionPattern.exec(new URL(url).pathname)?.[1];

const isKnown = (found: string | undefined): found is string =>
  found !== undefined && knownExtensions.has(found.toLowerCase());

function knownExtension(url: string): string | undefined {
  const found = foundExtension(url);
  return isKnown(found) ? found : undefined;
}

const usualExtension = (video: boolean): string =>
  video ? videoExtension : imageExtension;

const fileExtension = (url: string, video: boolean): string =>
  knownExtension(url) ?? usualExtension(video);

// Names are built from the page's data, so only the characters real
// usernames and ids use are kept. That is what earlier versions wrote for
// real posts, so files already on disk are recognised and skipped.
export class SafeFileNamer implements FileNamer {
  nameFor(item: DownloadItem): string {
    const username = item.username.replace(/[^A-Za-z0-9._]/g, "");
    const id = item.id.replace(/\W/g, "");
    const extension = fileExtension(item.url, item.video === true);
    return `${username}_${String(item.takenAt)}_${id}.${extension}`
      .replace(/\p{Cc}/gu, "")
      .replace(/^\.+/, "");
  }
}
