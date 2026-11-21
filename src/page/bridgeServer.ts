// Answers requests from the content script, each over its own MessagePort.
import {
  isBridgeRequest,
  type BridgeResponse,
  type ProcedureName,
} from "../shared/bridge";
import { EVENTS } from "../shared/dom";
import type { PageProcedure, ProcedureTable, RefusalDetector } from "./ports";

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
    private readonly procedures: ProcedureTable,
    private readonly sender: TrustedSender,
    private readonly refusals: RefusalDetector,
  ) {}

  listen(target: Pick<Window, "addEventListener">): void {
    target.addEventListener(EVENTS.message, (event) => {
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
    const procedure = this.procedure(name);
    if (procedure === undefined) return { ok: false, error: text.unknown };
    if (!procedure.isInput(input)) return { ok: false, error: text.invalid };
    try {
      return { ok: true, value: await procedure.handle(input) };
    } catch (error) {
      return this.refusals.isRefusal(error)
        ? { ok: false, error: message(error), refused: true }
        : { ok: false, error: message(error) };
    }
  }

  // Own properties only: "constructor" and "toString" are not procedures.
  private procedure(name: string): PageProcedure<ProcedureName> | undefined {
    return Object.hasOwn(this.procedures, name)
      ? this.procedures[name as ProcedureName]
      : undefined;
  }
}
