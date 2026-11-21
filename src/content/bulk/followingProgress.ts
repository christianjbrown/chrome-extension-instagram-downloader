// Shows on the panel where a run over the accounts the viewer follows has
// got to, and words how it ended.
import { ALL_DONE } from "../ui/percent";
import type { HeadingReporter, OverallProgress } from "../ui/ports";
import type { FollowingProgress, FollowingWording } from "./ports";

export class PanelFollowingProgress implements FollowingProgress {
  constructor(private readonly wording: FollowingWording) {}

  account(
    reporter: OverallProgress & HeadingReporter,
    done: number,
    total: number,
    username: string,
  ): void {
    reporter.overall(this.wording.account(done + 1, total), done / total);
    reporter.heading(username);
  }

  finished(reporter: OverallProgress, total: number): void {
    if (total > 0)
      reporter.overall(this.wording.accountsFinished(total), ALL_DONE);
  }

  summary(total: number, unreadable: string): string {
    return `${this.wording.followingFinished(total)}${unreadable}`;
  }
}
