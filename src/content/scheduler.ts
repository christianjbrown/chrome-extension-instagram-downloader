// Runs something later. The returned function cancels it.
export interface Scheduler {
  after(ms: number, callback: () => void): () => void;
}

export class TimeoutScheduler implements Scheduler {
  after(ms: number, callback: () => void): () => void {
    const timer = setTimeout(callback, ms);
    return () => {
      clearTimeout(timer);
    };
  }
}
