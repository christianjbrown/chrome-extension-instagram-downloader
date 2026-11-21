import { BlockedError } from "../errors";
import type { ErrorDescriber } from "../ports";
import type { FailureTally, FailureWording, RunStopPolicy } from "./ports";

// Keeps a run of the following list going past one account that will not
// load, a private or renamed one say, but gives up when several in a row
// fail, since that means something is wrong with every account.
export class ConsecutiveFailureTally implements FailureTally {
  private names: string[] = [];
  private inARow = 0;

  constructor(
    private readonly limit: number,
    private readonly stops: RunStopPolicy,
    private readonly errors: ErrorDescriber,
    private readonly wording: FailureWording,
  ) {}

  reset(): void {
    this.names = [];
    this.inARow = 0;
  }

  succeeded(): void {
    this.inARow = 0;
  }

  failed(username: string, error: unknown): void {
    if (this.stops.endsTheRun(error)) throw error;
    this.count(username, error);
  }

  // Several failures in a row mean something is wrong with every account.
  private count(username: string, error: unknown): void {
    this.names.push(username);
    this.inARow += 1;
    if (this.inARow >= this.limit)
      throw new BlockedError(
        this.wording.failureStop(
          this.inARow,
          username,
          this.errors.describe(error),
        ),
      );
  }

  summary(): string {
    return this.wording.unreadable(this.names);
  }
}
