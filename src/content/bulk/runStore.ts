// Keeps each signed-in account's Download following run in extension storage.
import { emptyRunState, isRunState, type RunState } from "./runState";
import type { RunStateStore, RunProgress } from "./ports";

export interface KeyValueArea {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
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
