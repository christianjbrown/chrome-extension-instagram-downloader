// Which errors end a whole run, so that no part of it shrugs one off and
// carries on.
import { BlockedError, isAbortError, isContextInvalidated } from "../errors";
import type { RunStopPolicy } from "./ports";

// A stop or a block ends the run.
export class StopOrBlockPolicy implements RunStopPolicy {
  endsTheRun(error: unknown): boolean {
    return isAbortError(error) || error instanceof BlockedError;
  }
}

// Only reloading the page fixes a reloaded extension, so it ends the run
// rather than failing every account after it.
export class ReloadedExtensionPolicy implements RunStopPolicy {
  endsTheRun(error: unknown): boolean {
    return isContextInvalidated(error);
  }
}

// Ends the run when any one of its policies would.
export class AnyStopPolicy implements RunStopPolicy {
  constructor(private readonly policies: readonly RunStopPolicy[]) {}

  endsTheRun(error: unknown): boolean {
    return this.policies.some((policy) => policy.endsTheRun(error));
  }
}
