import type { Viewer } from "../../shared/bridge";
import type { Bridge } from "../ports";
import type { CurrentViewer } from "./ports";

// The signed-in account, looked up once. Callers poll on a timer, so a failed
// lookup is not retried until a while has passed.
export class ViewerSource implements CurrentViewer {
  private viewer: Viewer | undefined;
  private failedAt = Number.NEGATIVE_INFINITY;

  constructor(
    private readonly bridge: Bridge,
    private readonly now: () => number,
    private readonly retryAfterMs: number,
  ) {}

  async current(): Promise<Viewer | undefined> {
    return this.viewer ?? this.lookUp();
  }

  private lookUp(): Promise<Viewer | undefined> {
    return this.waiting() ? Promise.resolve(undefined) : this.ask();
  }

  // A failed lookup is not tried again until the retry time has passed.
  private waiting(): boolean {
    return this.now() - this.failedAt < this.retryAfterMs;
  }

  private async ask(): Promise<Viewer | undefined> {
    try {
      this.viewer = await this.bridge.call("viewer", {});
      return this.viewer;
    } catch {
      this.failedAt = this.now();
      return undefined;
    }
  }
}
