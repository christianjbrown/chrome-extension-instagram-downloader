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
  return [{ id, username, takenAt: media.taken_at ?? takenAt, url }];
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

export function fileExtension(url: string): string {
  return extensionPattern.exec(new URL(url).pathname)?.[1] ?? "jpg";
}

// Matches the names earlier versions wrote, so files already on disk are
// recognised and skipped.
export function fileName(item: DownloadItem): string {
  const name = `${item.username}_${String(item.takenAt)}_${item.id}.${fileExtension(item.url)}`;
  return name.replace(/[<>:"/\\|?*]/g, "");
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
