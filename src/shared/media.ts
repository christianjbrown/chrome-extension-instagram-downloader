// The parts of Instagram's media objects this extension reads. The REST API,
// the Relay queries and the page's own responses all use this shape.

export interface MediaVersion {
  readonly url: string;
  readonly width: number;
  readonly height: number;
}

export interface InstagramMedia {
  readonly pk: string | number;
  readonly id?: string;
  readonly taken_at?: number;
  readonly image_versions2?: { readonly candidates: readonly MediaVersion[] };
  readonly video_versions?: readonly MediaVersion[];
  readonly carousel_media?: readonly InstagramMedia[];
  readonly user?: { readonly username: string; readonly pk?: string | number };
}

export interface DownloadItem {
  readonly id: string;
  readonly username: string;
  readonly takenAt: number;
  readonly url: string;
  readonly video?: true;
}

const area = (version: MediaVersion): number => version.width * version.height;

export function largestVersion(
  versions: readonly MediaVersion[],
): MediaVersion | undefined {
  return versions.reduce<MediaVersion | undefined>(
    (best, version) =>
      best === undefined || area(version) > area(best) ? version : best,
    undefined,
  );
}

export function bestUrl(media: InstagramMedia): string | undefined {
  const versions =
    media.video_versions ?? media.image_versions2?.candidates ?? [];
  return largestVersion(versions)?.url;
}

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

// One item per file: a carousel gives one per slide.
export function downloadItems(
  media: InstagramMedia,
  fallbackUsername = "unknown",
): DownloadItem[] {
  const username = media.user?.username ?? fallbackUsername;
  const takenAt = media.taken_at ?? 0;
  const slides = media.carousel_media ?? [media];
  return slides.flatMap((slide) => itemFor(slide, username, takenAt));
}

const extensionPattern = /\.([0-9a-z]+)(?:[?#]|$)/i;
const knownExtensions = new Set(["jpg", "jpeg", "png", "webp", "heic", "mp4"]);

// Only extensions Instagram really serves; anything else gets the usual one
// for the kind of file.
export function fileExtension(url: string, video = false): string {
  const found = extensionPattern.exec(new URL(url).pathname)?.[1];
  if (found !== undefined && knownExtensions.has(found.toLowerCase()))
    return found;
  return video ? "mp4" : "jpg";
}

// Names are built from the page's data, so only the characters real
// usernames and ids use are kept. That is what earlier versions wrote for
// real posts, so files already on disk are recognised and skipped.
export function fileName(item: DownloadItem): string {
  const username = item.username.replace(/[^A-Za-z0-9._]/g, "");
  const id = item.id.replace(/[^0-9_]/g, "");
  const extension = fileExtension(item.url, item.video === true);
  return `${username}_${String(item.takenAt)}_${id}.${extension}`
    .replace(/\p{Cc}/gu, "")
    .replace(/^\.+/, "");
}

// The last path segment of a CDN URL is the same for every size of a picture,
// which is how a picture on screen is matched back to its media.
export function assetName(url: string): string {
  const path = new URL(url, "https://www.instagram.com").pathname;
  return path.slice(path.lastIndexOf("/") + 1);
}

export function assetNames(media: InstagramMedia): string[] {
  const versions = [
    ...(media.image_versions2?.candidates ?? []),
    ...(media.video_versions ?? []),
  ];
  return versions.map((version) => assetName(version.url));
}
