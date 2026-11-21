import { errorMessage } from "../errorText";
import { BlockedError, isAbortError, isContextInvalidated } from "../errors";
import { describeFailureStop, describeUnreadable } from "./progressText";

export interface FailureTally {
  /** Forgets the last run, ready for a new one. */
  reset(): void;
  /** The account finished, so a run of failures is broken. */
  succeeded(): void;
  /** Notes a failed account, or rethrows when the run should stop instead. */
  failed(username: string, error: unknown): void;
  /** The accounts that could not be read, or nothing when every one could. */
  summary(): string;
}

// Keeps a run of the following list going past one account that will not
// load, a private or renamed one say, but gives up when several in a row
// fail, since that means something is wrong with every account.
export class ConsecutiveFailureTally implements FailureTally {
  private names: string[] = [];
  private inARow = 0;

  constructor(private readonly limit: number) {}

  reset(): void {
    this.names = [];
    this.inARow = 0;
  }

  succeeded(): void {
    this.inARow = 0;
  }

  failed(username: string, error: unknown): void {
    if (
      isAbortError(error) ||
      error instanceof BlockedError ||
      isContextInvalidated(error)
    )
      throw error;
    this.names.push(username);
    this.inARow += 1;
    if (this.inARow >= this.limit)
      throw new BlockedError(
        describeFailureStop(this.inARow, username, errorMessage(error)),
      );
  }

  summary(): string {
    return describeUnreadable(this.names);
  }
}
