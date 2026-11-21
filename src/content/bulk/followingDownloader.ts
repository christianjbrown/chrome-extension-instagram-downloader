import { ALL_DONE } from "../ui/percent";
import type { RunReporter } from "../ui/ports";
import type {
  Archiver,
  FailureTally,
  FollowingSource,
  RunStateStore,
  FollowingRequest,
  ResumePolicy,
  FollowingRunner,
  FollowingWording,
} from "./ports";
import type { RunState } from "./runState";

// Archives every account the viewer follows, one at a time, keeping its
// place so a stopped run carries on where it left off. Every run, a resumed
// one included, lists who the viewer follows afresh, so an account unfollowed
// since the run began is dropped rather than downloaded. The pacing lives in
// the API gate every call goes through, so a small account costs what it
// costs and nothing more.
export interface FollowingDependencies {
  readonly lister: FollowingSource;
  readonly archiver: Archiver;
  readonly store: RunStateStore;
  readonly resume: ResumePolicy;
  readonly now: () => number;
  readonly tally: FailureTally;
  readonly wording: FollowingWording;
}

export class FollowingDownloader implements FollowingRunner {
  constructor(private readonly deps: FollowingDependencies) {}

  async run(request: FollowingRequest): Promise<string> {
    const { viewer } = request;
    const stored = await this.deps.store.load(viewer.id);
    const following = await this.deps.lister.list(request);
    const { resume } = this.deps;
    const state = resume.begin(stored, following);
    await this.deps.store.save(viewer.id, state);
    const left = resume.remaining(state, following);
    this.deps.tally.reset();
    const last = await this.archiveAll(request, state, left, following.length);
    this.reportFinished(request.reporter, following.length);
    await this.deps.store.save(viewer.id, resume.finished(last));
    return `${this.deps.wording.followingFinished(following.length)}${this.deps.tally.summary()}`;
  }

  // Goes through the accounts left, giving back the state after the last.
  private async archiveAll(
    request: FollowingRequest,
    state: RunState,
    left: readonly string[],
    total: number,
  ): Promise<RunState> {
    const before = total - left.length;
    let current = state;
    for (const [index, username] of left.entries()) {
      this.report(request.reporter, before + index, total, username);
      current = await this.archiveOne(request, current, username);
    }
    return current;
  }

  // Where the run is, counting accounts already done before this one.
  private report(
    reporter: RunReporter,
    done: number,
    total: number,
    username: string,
  ): void {
    reporter.overall(this.deps.wording.account(done + 1, total), done / total);
    reporter.heading(username);
  }

  private reportFinished(reporter: RunReporter, total: number): void {
    if (total > 0)
      reporter.overall(this.deps.wording.accountsFinished(total), ALL_DONE);
  }

  // A failed account keeps the state it had, so the run carries on past it.
  private async archiveOne(
    request: FollowingRequest,
    state: RunState,
    username: string,
  ): Promise<RunState> {
    const { tally, resume } = this.deps;
    let current = state;
    try {
      await this.deps.archiver.archive({
        username,
        folder: request.folder,
        onlyNew: resume.archivedBefore(state, username),
        signal: request.signal,
        reporter: request.reporter,
      });
      tally.succeeded();
      current = resume.accountDone(state, username, this.deps.now());
      await this.deps.store.save(request.viewer.id, current);
    } catch (error) {
      tally.failed(username, error);
    }
    return current;
  }
}
