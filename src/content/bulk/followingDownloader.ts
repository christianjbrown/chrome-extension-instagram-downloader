import type { Viewer } from "../../shared/bridge";
import type { RunReporter } from "../ui/progressPanel";
import { describeAccount } from "./progressText";
import type { AccountArchiver } from "./accountArchiver";
import type { FailureTally } from "./failureTally";
import type { FollowingSource } from "./followingLister";
import type { RunStore, RunState } from "./runStore";

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
    const { viewer, reporter } = request;
    const state = await this.deps.store.load(viewer.id);
    const following = await this.deps.lister.list(request);
    state.following = following;
    state.done = state.done.filter((name) => following.includes(name));
    await this.deps.store.save(viewer.id, state);
    const remaining = following.filter((name) => !state.done.includes(name));
    this.deps.tally.reset();
    const before = following.length - remaining.length;
    for (const [index, username] of remaining.entries()) {
      const position = before + index + 1;
      reporter.overall(
        describeAccount(position, following.length),
        (position - 1) / following.length,
      );
      reporter.heading(username);
      await this.archiveOne(request, state, username);
    }
    await this.deps.store.save(viewer.id, {
      ...state,
      following: null,
      done: [],
    });
    return `Finished all ${String(following.length)} accounts you follow.${this.deps.tally.summary()}`;
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
