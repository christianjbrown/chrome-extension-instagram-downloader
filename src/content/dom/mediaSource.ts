// The address a picture or video poster on the page shows.
import { IMAGE_TAG, VIDEO_TAG } from "./selectors";

// Told apart by tag, so nothing here reaches for the window's classes.
const isImage = (element: Element): element is HTMLImageElement =>
  element.localName === IMAGE_TAG;
const isVideo = (element: Element): element is HTMLVideoElement =>
  element.localName === VIDEO_TAG;

// A video with no poster has nothing to match.
const noPoster = "";

const imageSource = (image: HTMLImageElement): string =>
  image.currentSrc || image.src;

const posterOf = (video: HTMLVideoElement): string | undefined =>
  video.poster === noPoster ? undefined : video.poster;

const videoSource = (element: Element): string | undefined =>
  isVideo(element) ? posterOf(element) : undefined;

/** The picture's address or the video's poster, or undefined for anything else. */
export const sourceOf = (element: Element): string | undefined =>
  isImage(element) ? imageSource(element) : videoSource(element);
