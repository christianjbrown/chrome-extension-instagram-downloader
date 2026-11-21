// How many files of an account were saved, skipped or failed.
import { OUTCOME, type WriteOutcome } from "../saving/ports";

export type Counts = Record<WriteOutcome, number>;

/** Nothing saved, skipped or failed yet. */
export const noCounts = (): Counts => ({
  [OUTCOME.saved]: 0,
  [OUTCOME.skipped]: 0,
  [OUTCOME.failed]: 0,
});
