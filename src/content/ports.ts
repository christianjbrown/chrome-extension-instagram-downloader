// What the parts of the content script depend on across folders, apart from
// how any of them is built.
import type { Input, Output, ProcedureName } from "../shared/bridge";

export interface Bridge {
  call<N extends ProcedureName>(name: N, input: Input<N>): Promise<Output<N>>;
}

// Runs something later. The returned function cancels it.
export interface Scheduler {
  after(ms: number, callback: () => void): () => void;
}
