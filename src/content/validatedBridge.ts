// Checks every answer from the page script before the rest of the content
// script sees it, with the check each procedure brings.
import type {
  Input,
  Output,
  ProcedureName,
  ProcedureOutputs,
} from "../shared/bridge";
import type { Bridge } from "./ports";

export class ValidatedBridge implements Bridge {
  constructor(
    private readonly inner: Bridge,
    private readonly outputs: ProcedureOutputs,
  ) {}

  async call<N extends ProcedureName>(
    name: N,
    input: Input<N>,
  ): Promise<Output<N>> {
    return this.outputs[name].parse(await this.inner.call(name, input));
  }
}
