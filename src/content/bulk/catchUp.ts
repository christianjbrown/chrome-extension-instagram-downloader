// When an account was archived in full before, a rerun only needs the posts
// since, so it stops once it reaches the ones already saved.
import type { CatchUpPolicy } from "./ports";

const firstPage = 1;

export class PinnedAwareCatchUp implements CatchUpPolicy {
  // A rerun stops at the first old page, so a total would only mislead.
  wantsTotal(page: number, onlyNew: boolean): boolean {
    return page === firstPage && !onlyNew;
  }

  // Page one can be all pinned posts, so only trust a later page.
  caughtUp(page: number, onlyNew: boolean, newFiles: number): boolean {
    return onlyNew && this.laterPageWithNothingNew(page, newFiles);
  }

  private laterPageWithNothingNew(page: number, newFiles: number): boolean {
    return page > firstPage && newFiles === 0;
  }
}
