// Calls into objects whose shape nothing promises, such as Instagram's own
// modules or browser features the DOM types do not describe yet. Each
// member is checked to be a function before it is called, and each answer
// is checked before it is used.
import { isJsonObject } from "./json";

/** A class, as `instanceof` checks a value against it. */
export type ClassOf<T> = abstract new (...args: never[]) => T;

/** A function whose arguments and answer are still unchecked. */
export type Method = (...args: unknown[]) => unknown;

const text = {
  missing: "is not available",
  unexpected: "sent an unexpected answer",
} as const;

const isMethod = (value: unknown): value is Method =>
  typeof value === "function";

const memberOf = (value: unknown, name: string): unknown =>
  isJsonObject(value) ? value[name] : undefined;

/** The named member of an object, which has to be a function. */
export function methodOf(value: unknown, name: string): Method {
  const member = memberOf(value, name);
  if (!isMethod(member)) throw new Error(`${name} ${text.missing}`);
  return member;
}

/** Calls the named member on the object it belongs to. */
export const callMember = (
  value: unknown,
  name: string,
  ...args: unknown[]
): unknown => Reflect.apply(methodOf(value, name), value, args);

function unexpected(name: string): never {
  throw new Error(`${name} ${text.unexpected}`);
}

/** An answer that has to be text. */
export const textAnswer = (value: unknown, name: string): string =>
  typeof value === "string" ? value : unexpected(name);

const isId = (value: unknown): value is string | number =>
  typeof value === "string" || typeof value === "number";

/** An answer that has to be an id, which Instagram sends as text or a number. */
export const idAnswer = (value: unknown, name: string): string =>
  isId(value) ? String(value) : unexpected(name);
