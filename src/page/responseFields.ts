// Reads one field at a time out of a query's answer, failing clearly when
// the answer does not have the shape the query expects.
import { isJsonObject, isList } from "../shared/json";

const text = { unexpected: "Unexpected response" } as const;

/** The named field of an object, which the value has to be. */
export function field(value: unknown, key: string): unknown {
  if (!isJsonObject(value)) throw new Error(`${text.unexpected} at ${key}`);
  return value[key];
}

/** The value, which has to be a list. */
export function asArray(value: unknown): readonly unknown[] {
  if (!isList(value)) throw new Error(text.unexpected);
  return value;
}
