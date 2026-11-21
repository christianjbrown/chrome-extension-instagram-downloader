// Where a Download following run is up to, and which accounts have been
// archived in full at least once.
import { isRecord } from "../../shared/json";

export interface RunState {
  following: string[] | null;
  done: string[];
  completed: Record<string, number>;
}

const isNames = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  (value as unknown[]).every((name) => typeof name === "string");

export function isRunState(value: unknown): value is RunState {
  if (!isRecord(value)) return false;
  const { following, done, completed } = value;
  return (
    (following === null || isNames(following)) &&
    isNames(done) &&
    isRecord(completed) &&
    Object.values(completed).every((time) => typeof time === "number")
  );
}

/** No run in progress, and nothing archived yet. */
export const emptyRunState = (): RunState => ({
  following: null,
  done: [],
  completed: {},
});
