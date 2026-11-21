// Sends requests to the page script and waits for its answer on a private port.
import {
  isBridgeResponse,
  type BridgeResponse,
  type ProcedureName,
} from "../shared/bridge";
import { RefusedError } from "../shared/refusal";
import type { PageTransport, Scheduler } from "./ports";

const text = {
  noAnswer: "The page did not answer",
  unreadable: "The page sent an unreadable answer",
} as const;

type PostMessage = (
  message: unknown,
  targetOrigin: string,
  transfer: Transferable[],
) => void;

type ChannelFactory = () => Pick<MessageChannel, "port1" | "port2">;

export interface BridgeEnvironment {
  readonly pageOrigin: string;
  readonly newChannel: ChannelFactory;
  readonly scheduler: Scheduler;
  readonly timeoutMs: number;
}

type Failure = Extract<BridgeResponse, { ok: false }>;

const failureOf = ({ error, refused }: Failure): Error =>
  refused === true ? new RefusedError(error) : new Error(error);

function answer(
  response: BridgeResponse,
  resolve: (value: unknown) => void,
  reject: (error: Error) => void,
): void {
  if (response.ok) resolve(response.value);
  else reject(failureOf(response));
}

// Anything but a well formed answer is turned down. What a well formed answer
// carries is checked by the validated bridge, before anything uses it.
function settle(
  data: unknown,
  resolve: (value: unknown) => void,
  reject: (error: Error) => void,
): void {
  if (isBridgeResponse(data)) answer(data, resolve, reject);
  else reject(new Error(text.unreadable));
}

export class PageBridge implements PageTransport {
  constructor(
    private readonly postMessage: PostMessage,
    private readonly env: BridgeEnvironment,
  ) {}

  call(name: ProcedureName, input: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const channel = this.env.newChannel();
      const cancel = this.env.scheduler.after(this.env.timeoutMs, () => {
        channel.port1.close();
        reject(new Error(text.noAnswer));
      });
      channel.port1.onmessage = (event: MessageEvent<unknown>) => {
        cancel();
        channel.port1.close();
        settle(event.data, resolve, reject);
      };
      this.postMessage({ igdlProcedure: name, input }, this.env.pageOrigin, [
        channel.port2,
      ]);
    });
  }
}
