import type { PostsPage } from "../../shared/bridge";
import type { Bridge } from "../bridgeClient";
import { endsTheRun } from "../errors";
import type { Gate } from "../pacing/apiGate";
import type { WaitReporter } from "../pacing/pacing";

export interface PostTotals {
  /** How many posts the account has, or undefined when that cannot be found. */
  find(
    username: string,
    firstPage: PostsPage,
    signal: AbortSignal,
    reporter: WaitReporter,
  ): Promise<number | undefined>;
}

// Takes the total from the first page when the profile was already loaded,
// and asks for the profile otherwise. That costs one paced call, and a
// missing total only costs the progress bar, so any failure but a stop or a
// block is shrugged off.
export class GatedPostTotals implements PostTotals {
  constructor(
    private readonly bridge: Bridge,
    private readonly gate: Gate,
  ) {}

  async find(
    username: string,
    firstPage: PostsPage,
    signal: AbortSignal,
    reporter: WaitReporter,
  ): Promise<number | undefined> {
    if (firstPage.total !== undefined) return firstPage.total;
    if (firstPage.items.length === 0) return undefined;
    try {
      const account = await this.gate.call(
        () => this.bridge.call("account", { username }),
        signal,
        reporter,
      );
      return account.totalPosts > 0 ? account.totalPosts : undefined;
    } catch (error) {
      if (endsTheRun(error)) throw error;
      return undefined;
    }
  }
}
