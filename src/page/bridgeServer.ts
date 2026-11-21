// Answers requests from the content script, each over its own MessagePort.
import {
  isBridgeRequest,
  type BridgeResponse,
  type Input,
  type ProcedureName,
} from "../shared/bridge";
import { EVENTS } from "../shared/dom";
import { errorMessage } from "../shared/errorMessage";
import type { PageProcedure, ProcedureTable, RefusalDetector } from "./ports";

const unknownRequest: BridgeResponse = { ok: false, error: "Unknown request" };
const invalidRequest: BridgeResponse = { ok: false, error: "Invalid request" };

type AnyProcedure = PageProcedure<ProcedureName>;

/** Who may ask: the page's own window, from the page's own origin. */
export interface TrustedSender {
  readonly origin: string;
  readonly source: MessageEventSource;
}

export class BridgeServer {
  constructor(
    private readonly procedures: ProcedureTable,
    private readonly sender: TrustedSender,
    private readonly refusals: RefusalDetector,
  ) {}

  listen(target: Pick<Window, "addEventListener">): void {
    target.addEventListener(EVENTS.message, (event) => {
      void this.handle(event);
    });
  }

  async handle(event: MessageEvent<unknown>): Promise<void> {
    if (this.isTrusted(event)) await this.answer(event);
  }

  private isTrusted({ origin, source }: MessageEvent<unknown>): boolean {
    return origin === this.sender.origin && source === this.sender.source;
  }

  // Each request brings the port its answer goes back on.
  private async answer({
    ports: [port],
    data,
  }: MessageEvent<unknown>): Promise<void> {
    if (port !== undefined) await this.reply(port, data);
  }

  private async reply(port: MessagePort, data: unknown): Promise<void> {
    if (isBridgeRequest(data))
      port.postMessage(await this.respond(data.igdlProcedure, data.input));
  }

  private respond(name: string, input: unknown): Promise<BridgeResponse> {
    const procedure = this.procedure(name);
    return procedure === undefined
      ? Promise.resolve(unknownRequest)
      : this.run(procedure, input);
  }

  private run(
    procedure: AnyProcedure,
    input: unknown,
  ): Promise<BridgeResponse> {
    return procedure.isInput(input)
      ? this.attempt(procedure, input)
      : Promise.resolve(invalidRequest);
  }

  private async attempt(
    procedure: AnyProcedure,
    input: Input<ProcedureName>,
  ): Promise<BridgeResponse> {
    try {
      return { ok: true, value: await procedure.handle(input) };
    } catch (error) {
      return this.failure(error);
    }
  }

  private failure(error: unknown): BridgeResponse {
    return this.refusals.isRefusal(error)
      ? { ok: false, error: errorMessage(error), refused: true }
      : { ok: false, error: errorMessage(error) };
  }

  // Own properties only: "constructor" and "toString" are not procedures.
  private procedure(name: string): AnyProcedure | undefined {
    return this.isKnown(name) ? this.procedures[name] : undefined;
  }

  private isKnown(name: string): name is ProcedureName {
    return Object.hasOwn(this.procedures, name);
  }
}
