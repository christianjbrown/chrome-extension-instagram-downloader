import type { Viewer } from "../../shared/bridge";
import type { Bridge } from "../bridgeClient";

const retryAfterMs = 60_000;

// The signed-in account, looked up once. Callers poll on a timer, so a failed
// lookup is not retried for a minute.
export class ViewerSource {
  private viewer: Viewer | undefined;
  private failedAt = Number.NEGATIVE_INFINITY;

  constructor(
    private readonly bridge: Bridge,
    private readonly now: () => number,
  ) {}

  async current(): Promise<Viewer | undefined> {
    if (this.viewer !== undefined) return this.viewer;
    if (this.now() - this.failedAt < retryAfterMs) return undefined;
    try {
      this.viewer = await this.bridge.call("viewer", {});
      return this.viewer;
    } catch {
      this.failedAt = this.now();
      return undefined;
    }
  }
}
