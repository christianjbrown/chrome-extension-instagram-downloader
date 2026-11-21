// Sends requests to the page script and waits for its answer on a private port.
import {
  isBridgeResponse,
  type BridgeResponse,
  type Input,
  type Output,
  type ProcedureName,
} from "../shared/bridge";
import { RefusedError } from "../shared/refusal";
import type { Scheduler, Bridge } from "./ports";

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

// Anything but a well formed answer is turned down.
function settle(
  data: unknown,
  resolve: (value: unknown) => void,
  reject: (error: Error) => void,
): void {
  if (isBridgeResponse(data)) answer(data, resolve, reject);
  else reject(new Error(text.unreadable));
}

export class PageBridge implements Bridge {
  constructor(
    private readonly postMessage: PostMessage,
    private readonly env: BridgeEnvironment,
  ) {}

  call<N extends ProcedureName>(name: N, input: Input<N>): Promise<Output<N>> {
    return new Promise((resolve, reject) => {
      const channel = this.env.newChannel();
      const cancel = this.env.scheduler.after(this.env.timeoutMs, () => {
        channel.port1.close();
        reject(new Error(text.noAnswer));
      });
      channel.port1.onmessage = (event: MessageEvent<unknown>) => {
        cancel();
        channel.port1.close();
        settle(
          event.data,
          (value) => {
            resolve(value as Output<N>);
          },
          reject,
        );
      };
      this.postMessage({ igdlProcedure: name, input }, this.env.pageOrigin, [
        channel.port2,
      ]);
    });
  }
}
