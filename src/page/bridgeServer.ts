// Answers requests from the content script, each over its own MessagePort.
import {
  isBridgeRequest,
  type BridgeResponse,
  type Input,
  type Output,
  type ProcedureName,
} from "../shared/bridge";
import type { InputValidator } from "./procedureInputs";
import type { RefusalDetector } from "./refusalDetector";

export type Handlers = {
  readonly [N in ProcedureName]: (input: Input<N>) => Promise<Output<N>>;
};

type AnyHandler = (input: unknown) => Promise<unknown>;

const text = {
  unknown: "Unknown request",
  invalid: "Invalid request",
} as const;

const message = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/** Who may ask: the page's own window, from the page's own origin. */
export interface TrustedSender {
  readonly origin: string;
  readonly source: MessageEventSource;
}

export class BridgeServer {
  constructor(
    private readonly handlers: Handlers,
    private readonly sender: TrustedSender,
    private readonly refusals: RefusalDetector,
    private readonly inputs: InputValidator,
  ) {}

  listen(target: Pick<Window, "addEventListener">): void {
    target.addEventListener("message", (event) => {
      void this.handle(event);
    });
  }

  async handle(event: MessageEvent): Promise<void> {
    const [port] = event.ports;
    const { origin, source } = this.sender;
    if (event.origin !== origin || event.source !== source) return;
    if (port === undefined || !isBridgeRequest(event.data)) return;
    const { igdlProcedure, input } = event.data;
    port.postMessage(await this.respond(igdlProcedure, input));
  }

  private async respond(name: string, input: unknown): Promise<BridgeResponse> {
    // Own properties only: "constructor" and "toString" are not procedures.
    if (
      !this.inputs.isProcedureName(name) ||
      !Object.hasOwn(this.handlers, name)
    )
      return { ok: false, error: text.unknown };
    if (!this.inputs.isValidInput(name, input))
      return { ok: false, error: text.invalid };
    const handler = this.handlers[name] as AnyHandler;
    try {
      return { ok: true, value: await handler(input) };
    } catch (error) {
      return this.refusals.isRefusal(error)
        ? { ok: false, error: message(error), refused: true }
        : { ok: false, error: message(error) };
    }
  }
}
