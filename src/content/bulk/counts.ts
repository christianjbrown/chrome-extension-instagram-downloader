// How many files of an account were saved, skipped or failed.
import { WRITE_OUTCOMES, type WriteOutcome } from "../saving/ports";

export type Counts = Record<WriteOutcome, number>;

/** Nothing saved, skipped or failed yet. */
export const noCounts = (): Counts =>
  Object.fromEntries(WRITE_OUTCOMES.map((outcome) => [outcome, 0])) as Counts;
