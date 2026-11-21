import type { Viewer } from "../../shared/bridge";
import type { Bridge } from "../bridgeClient";

// The signed-in account, looked up once. Callers poll on a timer, so a failed
// lookup is not retried until a while has passed.
export class ViewerSource {
  private viewer: Viewer | undefined;
  private failedAt = Number.NEGATIVE_INFINITY;

  constructor(
    private readonly bridge: Bridge,
    private readonly now: () => number,
    private readonly retryAfterMs: number,
  ) {}

  async current(): Promise<Viewer | undefined> {
    if (this.viewer !== undefined) return this.viewer;
    if (this.now() - this.failedAt < this.retryAfterMs) return undefined;
    try {
      this.viewer = await this.bridge.call("viewer", {});
      return this.viewer;
    } catch {
      this.failedAt = this.now();
      return undefined;
    }
  }
}
