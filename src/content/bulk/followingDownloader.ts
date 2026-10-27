import type { Viewer } from "../../shared/bridge";
import type { Bridge } from "../bridgeClient";
import type { Pacer } from "../pacing/pacer";
import type { RunReporter } from "../ui/progressPanel";
import type { AccountArchiver } from "./accountArchiver";
import type { RunStore, RunState } from "./runStore";

export interface FollowingRequest {
  readonly viewer: Viewer;
  readonly folder: FileSystemDirectoryHandle;
  readonly signal: AbortSignal;
  readonly reporter: RunReporter;
}

// Archives every account the viewer follows, one at a time, keeping its
// place so a stopped run carries on where it left off.
export class FollowingDownloader {
  constructor(
    private readonly bridge: Bridge,
    private readonly archiver: AccountArchiver,
    private readonly store: RunStore,
    private readonly pacer: Pacer,
  ) {}

  async run(request: FollowingRequest): Promise<string> {
    const { viewer, signal, reporter } = request;
    const state = await this.store.load(viewer.id);
    const following = state.following ?? (await this.list(request));
    state.following = following;
    await this.store.save(viewer.id, state);
    const remaining = following.filter((name) => !state.done.includes(name));
    for (const [index, username] of remaining.entries()) {
      reporter.heading(
        `${username} (${String(state.done.length + 1)} of ${String(following.length)})`,
      );
      await this.archiver.archive({
        username,
        folder: request.folder,
        onlyNew: state.completed[username] !== undefined,
        signal,
        reporter,
      });
      await this.markDone(viewer.id, state, username);
      if (index < remaining.length - 1) {
        reporter.detail("Resting before the next account");
        await this.pacer.sleeper.between(
          this.pacer.pacing.accountDelayMs,
          signal,
        );
      }
    }
    await this.store.save(viewer.id, { ...state, following: null, done: [] });
    return `Finished all ${String(following.length)} accounts you follow.`;
  }

  private async markDone(
    viewerId: string,
    state: RunState,
    username: string,
  ): Promise<void> {
    state.done.push(username);
    state.completed[username] = Date.now();
    await this.store.save(viewerId, state);
  }

  private async list({
    viewer,
    signal,
    reporter,
  }: FollowingRequest): Promise<string[]> {
    reporter.heading("Listing accounts you follow");
    const usernames: string[] = [];
    let next: string | undefined;
    do {
      const page = await this.pacer.gate.call(
        () => this.bridge.call("followingPage", { userId: viewer.id, next }),
        signal,
        reporter,
      );
      usernames.push(...page.usernames);
      reporter.detail(`${String(usernames.length)} so far`);
      next = page.next;
    } while (next !== undefined);
    return [...new Set(usernames)];
  }
}
