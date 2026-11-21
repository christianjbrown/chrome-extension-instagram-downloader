// Checks every answer from the page script before the rest of the content
// script sees it.
import type { Input, Output, ProcedureName } from "../shared/bridge";
import { parseOutput } from "../shared/schemas";
import type { Bridge } from "./ports";

export class ValidatedBridge implements Bridge {
  constructor(private readonly inner: Bridge) {}

  async call<N extends ProcedureName>(
    name: N,
    input: Input<N>,
  ): Promise<Output<N>> {
    return parseOutput(name, await this.inner.call(name, input));
  }
}
