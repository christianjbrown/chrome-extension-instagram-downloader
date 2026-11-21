import type { Viewer } from "../../shared/bridge";
import { ALL_DONE } from "../ui/percent";
import type { RunReporter } from "../ui/progressPanel";
import {
  describeAccount,
  describeAccountsFinished,
  describeFollowingFinished,
} from "./progressText";
import type { AccountArchiver } from "./accountArchiver";
import type { FailureTally } from "./failureTally";
import type { FollowingSource } from "./followingLister";
import { begin, finished, remaining, type RunState } from "./runState";
import type { RunStore } from "./runStore";

export interface FollowingRequest {
  readonly viewer: Viewer;
  readonly folder: FileSystemDirectoryHandle;
  readonly signal: AbortSignal;
  readonly reporter: RunReporter;
}

// Archives every account the viewer follows, one at a time, keeping its
// place so a stopped run carries on where it left off. Every run, a resumed
// one included, lists who the viewer follows afresh, so an account unfollowed
// since the run began is dropped rather than downloaded. The pacing lives in
// the API gate every call goes through, so a small account costs what it
// costs and nothing more.
export interface FollowingDependencies {
  readonly lister: FollowingSource;
  readonly archiver: AccountArchiver;
  readonly store: RunStore;
  readonly now: () => number;
  readonly tally: FailureTally;
}

export class FollowingDownloader {
  constructor(private readonly deps: FollowingDependencies) {}

  async run(request: FollowingRequest): Promise<string> {
    const { viewer } = request;
    const stored = await this.deps.store.load(viewer.id);
    const following = await this.deps.lister.list(request);
    const state = begin(stored, following);
    await this.deps.store.save(viewer.id, state);
    const left = remaining(state, following);
    this.deps.tally.reset();
    const before = following.length - left.length;
    for (const [index, username] of left.entries()) {
      this.report(request.reporter, before + index, following.length, username);
      await this.archiveOne(request, state, username);
    }
    if (following.length > 0)
      request.reporter.overall(
        describeAccountsFinished(following.length),
        ALL_DONE,
      );
    await this.deps.store.save(viewer.id, finished(state));
    return `${describeFollowingFinished(following.length)}${this.deps.tally.summary()}`;
  }

  // Where the run is, counting accounts already done before this one.
  private report(
    reporter: RunReporter,
    done: number,
    total: number,
    username: string,
  ): void {
    reporter.overall(describeAccount(done + 1, total), done / total);
    reporter.heading(username);
  }

  private async archiveOne(
    request: FollowingRequest,
    state: RunState,
    username: string,
  ): Promise<void> {
    const { tally } = this.deps;
    try {
      await this.deps.archiver.archive({
        username,
        folder: request.folder,
        onlyNew: state.completed[username] !== undefined,
        signal: request.signal,
        reporter: request.reporter,
      });
      tally.succeeded();
      await this.markDone(request.viewer.id, state, username);
    } catch (error) {
      tally.failed(username, error);
    }
  }

  private async markDone(
    viewerId: string,
    state: RunState,
    username: string,
  ): Promise<void> {
    state.done.push(username);
    state.completed[username] = this.deps.now();
    await this.deps.store.save(viewerId, state);
  }
}
