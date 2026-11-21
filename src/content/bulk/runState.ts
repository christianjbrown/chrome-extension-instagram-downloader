// Where a Download following run is up to, and which accounts have been
// archived in full at least once, with the steps a run takes it through.

export interface RunState {
  following: string[] | null;
  done: string[];
  completed: Record<string, number>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

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

/** A run over who the viewer follows now, keeping the progress made on them. */
export const begin = (state: RunState, following: string[]): RunState => ({
  ...state,
  following,
  done: state.done.filter((name) => following.includes(name)),
});

/** The accounts the run still has to archive, in order. */
export const remaining = (state: RunState, following: string[]): string[] =>
  following.filter((name) => !state.done.includes(name));

/** The run is over, but which accounts were archived in full is kept. */
export const finished = (state: RunState): RunState => ({
  ...state,
  following: null,
  done: [],
});
