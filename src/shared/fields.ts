// Builds objects whose optional fields are left out rather than set to
// undefined, as Instagram does.

function present<K extends string, T>(key: K, value: T): Partial<Record<K, T>> {
  const field: Partial<Record<K, T>> = {};
  field[key] = value;
  return field;
}

/** The field as an object to spread, or nothing to spread when it is absent. */
export const optionalField = <K extends string, T>(
  key: K,
  value: T | undefined,
): Partial<Record<K, T>> => (value === undefined ? {} : present(key, value));

const NONE = 0;

/** A count of things left out, or undefined when there were none. */
export const someCount = (count: number): number | undefined =>
  count === NONE ? undefined : count;
