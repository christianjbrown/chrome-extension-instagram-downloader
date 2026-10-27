// Answers requests from the content script, each over its own MessagePort.
import {
  isBridgeRequest,
  pageOrigin,
  type BridgeResponse,
  type Input,
  type Output,
  type ProcedureName,
} from "../shared/bridge";

export type Handlers = {
  readonly [N in ProcedureName]: (input: Input<N>) => Promise<Output<N>>;
};

type AnyHandler = (input: unknown) => Promise<unknown>;

const message = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export class BridgeServer {
  constructor(private readonly handlers: Handlers) {}

  listen(target: Pick<Window, "addEventListener">): void {
    target.addEventListener("message", (event) => {
      void this.handle(event);
    });
  }

  async handle(event: MessageEvent): Promise<void> {
    const [port] = event.ports;
    if (event.origin !== pageOrigin || port === undefined) return;
    if (!isBridgeRequest(event.data)) return;
    const { igdlProcedure, input } = event.data;
    const handler = this.handlers[igdlProcedure] as AnyHandler | undefined;
    port.postMessage(await this.respond(handler, input));
  }

  private async respond(
    handler: AnyHandler | undefined,
    input: unknown,
  ): Promise<BridgeResponse> {
    if (handler === undefined) return { ok: false, error: "Unknown request" };
    try {
      return { ok: true, value: await handler(input) };
    } catch (error) {
      return { ok: false, error: message(error) };
    }
  }
}
