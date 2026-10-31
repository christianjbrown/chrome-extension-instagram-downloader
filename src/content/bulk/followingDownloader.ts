import type { Viewer } from "../../shared/bridge";
import type { Pacer } from "../pacing/pacer";
import type { RunReporter } from "../ui/progressPanel";
import type { AccountArchiver } from "./accountArchiver";
import type { FollowingSource } from "./followingLister";
import type { RunStore, RunState } from "./runStore";

export interface FollowingRequest {
  readonly viewer: Viewer;
  readonly folder: FileSystemDirectoryHandle;
  readonly signal: AbortSignal;
  readonly reporter: RunReporter;
}

// Archives every account the viewer follows, one at a time, keeping its
// place so a stopped run carries on where it left off.
export interface FollowingDependencies {
  readonly lister: FollowingSource;
  readonly archiver: AccountArchiver;
  readonly store: RunStore;
  readonly pacer: Pacer;
  readonly now: () => number;
}

export class FollowingDownloader {
  constructor(private readonly deps: FollowingDependencies) {}

  async run(request: FollowingRequest): Promise<string> {
    const { viewer, signal, reporter } = request;
    const state = await this.deps.store.load(viewer.id);
    const following = state.following ?? (await this.deps.lister.list(request));
    state.following = following;
    await this.deps.store.save(viewer.id, state);
    const remaining = following.filter((name) => !state.done.includes(name));
    for (const [index, username] of remaining.entries()) {
      reporter.heading(
        `${username} (${String(state.done.length + 1)} of ${String(following.length)})`,
      );
      await this.deps.archiver.archive({
        username,
        folder: request.folder,
        onlyNew: state.completed[username] !== undefined,
        signal,
        reporter,
      });
      await this.markDone(viewer.id, state, username);
      if (index < remaining.length - 1) {
        reporter.detail("Resting before the next account");
        await this.deps.pacer.sleeper.between(
          this.deps.pacer.pacing.accountDelayMs,
          signal,
        );
      }
    }
    await this.deps.store.save(viewer.id, {
      ...state,
      following: null,
      done: [],
    });
    return `Finished all ${String(following.length)} accounts you follow.`;
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
