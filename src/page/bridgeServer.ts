// Answers requests from the content script, each over its own MessagePort.
import {
  isBridgeRequest,
  type BridgeResponse,
  type Input,
  type Output,
  type ProcedureName,
} from "../shared/bridge";
import { isProcedureName, isValidInput } from "./procedureInputs";

export type Handlers = {
  readonly [N in ProcedureName]: (input: Input<N>) => Promise<Output<N>>;
};

type AnyHandler = (input: unknown) => Promise<unknown>;

const message = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export class BridgeServer {
  // Only messages the page's own window sent, from the page's own origin.
  constructor(
    private readonly handlers: Handlers,
    private readonly pageOrigin: string,
    private readonly source: MessageEventSource,
  ) {}

  listen(target: Pick<Window, "addEventListener">): void {
    target.addEventListener("message", (event) => {
      void this.handle(event);
    });
  }

  async handle(event: MessageEvent): Promise<void> {
    const [port] = event.ports;
    if (event.origin !== this.pageOrigin || event.source !== this.source)
      return;
    if (port === undefined || !isBridgeRequest(event.data)) return;
    const { igdlProcedure, input } = event.data;
    port.postMessage(await this.respond(igdlProcedure, input));
  }

  private async respond(name: string, input: unknown): Promise<BridgeResponse> {
    // Own properties only: "constructor" and "toString" are not procedures.
    if (!isProcedureName(name) || !Object.hasOwn(this.handlers, name))
      return { ok: false, error: "Unknown request" };
    if (!isValidInput(name, input))
      return { ok: false, error: "Invalid request" };
    const handler = this.handlers[name] as AnyHandler;
    try {
      return { ok: true, value: await handler(input) };
    } catch (error) {
      return { ok: false, error: message(error) };
    }
  }
}
