// Where a Download following run is up to, and which accounts have been
// archived in full at least once. Kept per signed-in account.

export interface RunState {
  following: string[] | null;
  done: string[];
  completed: Record<string, number>;
}

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
    return stored ?? { following: null, done: [], completed: {} };
  }

  save(viewerId: string, state: RunState): Promise<void> {
    return this.area.set({ [this.key(viewerId)]: state });
  }

  async inProgress(viewerId: string): Promise<boolean> {
    return (await this.load(viewerId)).following !== null;
  }
}
