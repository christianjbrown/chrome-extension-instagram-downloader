// When an account was archived in full before, a rerun only needs the posts
// since, so it stops once it reaches the ones already saved.

export interface CatchUpPolicy {
  /** Whether to look up the account's total before writing this page. */
  wantsTotal(page: number, onlyNew: boolean): boolean;
  /** Whether the run has reached posts saved before, after writing this page. */
  caughtUp(page: number, onlyNew: boolean, newFiles: number): boolean;
}

const firstPage = 1;

export class PinnedAwareCatchUp implements CatchUpPolicy {
  // A rerun stops at the first old page, so a total would only mislead.
  wantsTotal(page: number, onlyNew: boolean): boolean {
    return page === firstPage && !onlyNew;
  }

  // Page one can be all pinned posts, so only trust a later page.
  caughtUp(page: number, onlyNew: boolean, newFiles: number): boolean {
    return onlyNew && page > firstPage && newFiles === 0;
  }
}
