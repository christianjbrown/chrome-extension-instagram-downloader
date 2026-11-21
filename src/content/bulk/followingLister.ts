import type { Bridge } from "../bridgeClient";
import type { Pacer } from "../pacing/pacer";
import type { RunReporter } from "../ui/progressPanel";
import type { Viewer } from "../../shared/bridge";

const text = {
  heading: "Listing accounts you follow",
  soFar: "so far",
} as const;

export interface ListRequest {
  readonly viewer: Viewer;
  readonly signal: AbortSignal;
  readonly reporter: RunReporter;
}

export interface FollowingSource {
  list(request: ListRequest): Promise<string[]>;
}

// Lists every account the viewer follows, a page at a time, at the pace the
// gate allows.
export class FollowingLister implements FollowingSource {
  constructor(
    private readonly bridge: Bridge,
    private readonly pacer: Pacer,
  ) {}

  async list({ viewer, signal, reporter }: ListRequest): Promise<string[]> {
    reporter.heading(text.heading);
    const usernames: string[] = [];
    let next: string | undefined;
    do {
      const page = await this.pacer.gate.call(
        () => this.bridge.call("followingPage", { userId: viewer.id, next }),
        signal,
        reporter,
      );
      usernames.push(...page.usernames);
      reporter.detail(`${String(usernames.length)} ${text.soFar}`);
      next = page.next;
    } while (next !== undefined);
    return [...new Set(usernames)];
  }
}
