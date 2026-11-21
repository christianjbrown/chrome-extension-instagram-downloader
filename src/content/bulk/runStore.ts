// Keeps each signed-in account's Download following run in extension storage.
import { emptyRunState, isRunState, type RunState } from "./runState";

export interface KeyValueArea {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

export interface RunStateStore {
  load(viewerId: string): Promise<RunState>;
  save(viewerId: string, state: RunState): Promise<void>;
}

export interface RunProgress {
  /** Whether a run for this account was stopped part way. */
  inProgress(viewerId: string): Promise<boolean>;
}

const keyPrefix = "followingDownload:";

export class RunStore implements RunStateStore, RunProgress {
  constructor(private readonly area: KeyValueArea) {}

  private key(viewerId: string): string {
    return `${keyPrefix}${viewerId}`;
  }

  // Anything stored that is not a run, from an older version say, counts as
  // no run at all rather than being trusted.
  async load(viewerId: string): Promise<RunState> {
    const key = this.key(viewerId);
    const stored = (await this.area.get(key))[key];
    return isRunState(stored) ? stored : emptyRunState();
  }

  save(viewerId: string, state: RunState): Promise<void> {
    return this.area.set({ [this.key(viewerId)]: state });
  }

  async inProgress(viewerId: string): Promise<boolean> {
    return (await this.load(viewerId)).following !== null;
  }
}
