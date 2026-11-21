import type { Bridge } from "../ports";
import type { Gate } from "../pacing/ports";
import type { ListRequest, FollowingSource } from "./ports";

const text = {
  heading: "Listing accounts you follow",
  soFar: "so far",
} as const;

// Lists every account the viewer follows, a page at a time, at the pace the
// gate allows.
export class FollowingLister implements FollowingSource {
  constructor(
    private readonly bridge: Bridge,
    private readonly gate: Gate,
  ) {}

  async list({ viewer, signal, reporter }: ListRequest): Promise<string[]> {
    reporter.heading(text.heading);
    const usernames: string[] = [];
    let next: string | undefined;
    do {
      const page = await this.gate.call(
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
