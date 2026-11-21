// Sends requests to the page script and waits for its answer on a private port.
import {
  isBridgeResponse,
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
        const response = event.data;
        if (!isBridgeResponse(response)) reject(new Error(text.unreadable));
        else if (response.ok) resolve(response.value as Output<N>);
        else if (response.refused === true)
          reject(new RefusedError(response.error));
        else reject(new Error(response.error));
      };
      this.postMessage({ igdlProcedure: name, input }, this.env.pageOrigin, [
        channel.port2,
      ]);
    });
  }
}
