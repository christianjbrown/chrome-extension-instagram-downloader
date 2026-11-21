// The checks every procedure's answer is built from. Any script on the page
// can answer a request, so every reply is treated as untrusted input and
// rejected when it does not have the expected shape.
import { isRecord, type JsonObject } from "./json";

type Parser<T> = (value: unknown) => T;

export function reject(what: string): never {
  throw new Error(`The page sent an unexpected ${what}`);
}

export const record = (value: unknown, what: string): JsonObject =>
  isRecord(value) ? value : reject(what);

export const text = (value: unknown, what: string): string =>
  typeof value === "string" ? value : reject(what);

export const count = (value: unknown, what: string): number =>
  typeof value === "number" && Number.isFinite(value) ? value : reject(what);

// Instagram marks a missing field with null as often as it leaves it out: a
// photo arrives with video_versions and carousel_media set to null.
export const optional = <T>(value: unknown, parse: Parser<T>): T | undefined =>
  value === undefined || value === null ? undefined : parse(value);

export const list = <T>(value: unknown, parse: Parser<T>, what: string): T[] =>
  Array.isArray(value) ? (value as unknown[]).map(parse) : reject(what);
