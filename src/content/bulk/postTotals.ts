import type { Account, PostsPage } from "../../shared/bridge";
import type { Bridge } from "../ports";
import type { Gate } from "../pacing/ports";
import type { PostTotals, RunStopPolicy } from "./ports";
import type { WaitReporter } from "../pacing/pacing";

// Instagram says nought posts when it will not say how many.
const knownTotal = ({ totalPosts }: Account): number | undefined =>
  totalPosts > 0 ? totalPosts : undefined;

// Takes the total from the first page when the profile was already loaded,
// and asks for the profile otherwise. That costs one paced call, and a
// missing total only costs the progress bar, so any failure but a stop or a
// block is shrugged off.
export class GatedPostTotals implements PostTotals {
  constructor(
    private readonly bridge: Bridge,
    private readonly gate: Gate,
    private readonly stops: RunStopPolicy,
  ) {}

  async find(
    username: string,
    firstPage: PostsPage,
    signal: AbortSignal,
    reporter: WaitReporter,
  ): Promise<number | undefined> {
    return (
      firstPage.total ?? this.fromProfile(username, firstPage, signal, reporter)
    );
  }

  // An account with no posts at all has no total worth asking for.
  private fromProfile(
    username: string,
    firstPage: PostsPage,
    signal: AbortSignal,
    reporter: WaitReporter,
  ): Promise<number | undefined> {
    return firstPage.items.length === 0
      ? Promise.resolve(undefined)
      : this.ask(username, signal, reporter);
  }

  private async ask(
    username: string,
    signal: AbortSignal,
    reporter: WaitReporter,
  ): Promise<number | undefined> {
    try {
      return knownTotal(
        await this.gate.call(
          () => this.bridge.call("account", { username }),
          signal,
          reporter,
        ),
      );
    } catch (error) {
      this.rethrowStops(error);
      return undefined;
    }
  }

  // A stop or a block still ends the run; anything else only costs the bar.
  private rethrowStops(error: unknown): void {
    if (this.stops.endsTheRun(error)) throw error;
  }
}
