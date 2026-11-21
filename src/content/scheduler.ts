// Runs something later. The returned function cancels it.
export interface Scheduler {
  after(ms: number, callback: () => void): () => void;
}

/** The window's own timers, which the scheduler is the only user of. */
export type Timers = Pick<
  WindowOrWorkerGlobalScope,
  "setTimeout" | "clearTimeout"
>;

export class TimeoutScheduler implements Scheduler {
  constructor(private readonly timers: Timers) {}

  after(ms: number, callback: () => void): () => void {
    const timer = this.timers.setTimeout(callback, ms);
    return () => {
      this.timers.clearTimeout(timer);
    };
  }
}
