// The parts of Instagram's media objects this extension reads. The REST API,
// the Relay queries and the page's own responses all use this shape.
import { pageOrigin } from "./origin";

/** Stands in for the time a post was taken when nothing says. */
export const UNKNOWN_TAKEN_AT = 0;

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

// The last path segment of a CDN URL is the same for every size of a picture,
// which is how a picture on screen is matched back to its media.
export function assetName(url: string): string {
  const path = new URL(url, pageOrigin).pathname;
  return path.slice(path.lastIndexOf("/") + 1);
}

export function assetNames(media: InstagramMedia): string[] {
  const versions = [
    ...(media.image_versions2?.candidates ?? []),
    ...(media.video_versions ?? []),
  ];
  return versions.map((version) => assetName(version.url));
}
