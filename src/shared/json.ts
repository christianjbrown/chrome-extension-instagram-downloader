// Guards for parsed JSON, whose shape nothing promises.

export type JsonObject = Record<string, unknown>;

/** Any object, arrays included, since Instagram nests objects in arrays. */
export const isJsonObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null;

/** A list, each of whose entries is still unchecked. */
export const isList = (value: unknown): value is readonly unknown[] =>
  Array.isArray(value);

/** The value's entries when it is a list, and none when it is anything else. */
export const entriesOf = (value: unknown): readonly unknown[] =>
  isList(value) ? value : [];

/** An object with named fields, which an array is not. */
export const isRecord = (value: unknown): value is JsonObject =>
  isJsonObject(value) && !Array.isArray(value);

/** An object that names an account. */
export const hasUsername = (
  value: unknown,
): value is JsonObject & { username: string } =>
  isJsonObject(value) && typeof value.username === "string";

/** The value when it is text, and undefined when it is anything else. */
export const textOrUndefined = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;
