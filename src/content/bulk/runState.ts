// Where a Download following run is up to, and which accounts have been
// archived in full at least once.
import { isRecord, type JsonObject } from "../../shared/json";

export interface RunState {
  following: string[] | null;
  done: string[];
  completed: Record<string, number>;
}

const isNames = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  (value as unknown[]).every((name) => typeof name === "string");

// No run in progress, or the accounts the run is going through.
const isFollowing = (value: unknown): boolean =>
  value === null || isNames(value);

const isTimes = (value: unknown): boolean =>
  isRecord(value) &&
  Object.values(value).every((time) => typeof time === "number");

const hasProgress = ({ done, completed }: JsonObject): boolean =>
  isNames(done) && isTimes(completed);

const hasRunFields = (value: JsonObject): boolean =>
  isFollowing(value.following) && hasProgress(value);

export function isRunState(value: unknown): value is RunState {
  return isRecord(value) && hasRunFields(value);
}

/** No run in progress, and nothing archived yet. */
export const emptyRunState = (): RunState => ({
  following: null,
  done: [],
  completed: {},
});
