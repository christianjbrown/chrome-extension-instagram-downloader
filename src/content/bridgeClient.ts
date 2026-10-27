// Sends requests to the page script and waits for its answer on a private port.
import {
  pageOrigin,
  type BridgeResponse,
  type Input,
  type Output,
  type ProcedureName,
} from "../shared/bridge";

export interface Bridge {
  call<N extends ProcedureName>(name: N, input: Input<N>): Promise<Output<N>>;
}

type PostMessage = (
  message: unknown,
  targetOrigin: string,
  transfer: Transferable[],
) => void;

export class PageBridge implements Bridge {
  constructor(
    private readonly postMessage: PostMessage,
    private readonly timeoutMs = 60_000,
  ) {}

  call<N extends ProcedureName>(name: N, input: Input<N>): Promise<Output<N>> {
    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      const timer = setTimeout(() => {
        channel.port1.close();
        reject(new Error("The page did not answer"));
      }, this.timeoutMs);
      channel.port1.onmessage = (event: MessageEvent<BridgeResponse>) => {
        clearTimeout(timer);
        channel.port1.close();
        const response = event.data;
        if (response.ok) resolve(response.value as Output<N>);
        else reject(new Error(response.error));
      };
      this.postMessage({ igdlProcedure: name, input }, pageOrigin, [
        channel.port2,
      ]);
    });
  }
}
