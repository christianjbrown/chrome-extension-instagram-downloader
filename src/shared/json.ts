// Guards for parsed JSON, whose shape nothing promises.

export type JsonObject = Record<string, unknown>;

/** Any object, arrays included, since Instagram nests objects in arrays. */
export const isJsonObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null;

/** An object with named fields, which an array is not. */
export const isRecord = (value: unknown): value is JsonObject =>
  isJsonObject(value) && !Array.isArray(value);
