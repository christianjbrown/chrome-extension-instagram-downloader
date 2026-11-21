// Keeps each signed-in account's Download following run in extension storage.
import { emptyRunState, type RunState } from "./runState";

export interface KeyValueArea {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

const keyPrefix = "followingDownload:";

export class RunStore {
  constructor(private readonly area: KeyValueArea) {}

  private key(viewerId: string): string {
    return `${keyPrefix}${viewerId}`;
  }

  async load(viewerId: string): Promise<RunState> {
    const key = this.key(viewerId);
    const stored = (await this.area.get(key))[key] as RunState | undefined;
    return stored ?? emptyRunState();
  }

  save(viewerId: string, state: RunState): Promise<void> {
    return this.area.set({ [this.key(viewerId)]: state });
  }

  async inProgress(viewerId: string): Promise<boolean> {
    return (await this.load(viewerId)).following !== null;
  }
}
