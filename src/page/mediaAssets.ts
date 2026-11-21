// Which pictures a post or slide Instagram sent holds. Nothing in it has been
// checked, so a list that is missing, null or not a list holds nothing.
import {
  entriesOf,
  isJsonObject,
  isRecord,
  type JsonObject,
} from "../shared/json";
import { assetName } from "../shared/media";
import { isMediaRecord } from "./mediaShapes";
import type { PageMedia } from "./ports";

const records = (value: unknown): JsonObject[] =>
  entriesOf(value).filter(isRecord);

const isText = (value: unknown): value is string => typeof value === "string";

const urlsOf = (versions: unknown): string[] =>
  records(versions)
    .map((version) => version.url)
    .filter(isText);

const candidatesOf = ({ image_versions2: images }: JsonObject): unknown =>
  isJsonObject(images) ? images.candidates : undefined;

/** The asset of every picture size and video the media holds. */
export const assetNamesOf = (media: JsonObject): string[] =>
  [...urlsOf(candidatesOf(media)), ...urlsOf(media.video_versions)].map(
    assetName,
  );

/** The media, then each of its slides that carries an id. */
export const slidesOf = (media: PageMedia): PageMedia[] => [
  media,
  ...records(media.carousel_media).filter(isMediaRecord),
];
