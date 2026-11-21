import { errorMessage } from "../errorText";
import { BlockedError, endsTheRun, isContextInvalidated } from "../errors";
import { describeFailureStop, describeUnreadable } from "./progressText";
import type { FailureTally } from "./ports";

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
    // Only reloading the page fixes a reloaded extension, so it ends the run
    // too rather than failing every account after it.
    if (endsTheRun(error) || isContextInvalidated(error)) throw error;
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
