import { AccountCounts } from "../../../src/content/bulk/accountCounts";

describe("AccountCounts", () => {
  it("leaves the bar alone until the account's total is known", () => {
    const counts = new AccountCounts();
    counts.nextPost();
    expect(counts.fraction()).toBeUndefined();
    expect(counts.finishedFraction()).toBeUndefined();
  });

  it("counts posts against the total, never past a full bar", () => {
    const counts = new AccountCounts();
    counts.total(2);
    counts.unreadable(undefined);
    counts.nextPost();
    expect(counts.fraction()).toBe(0.5);
    counts.unreadable(3);
    expect(counts.fraction()).toBe(1);
    expect(counts.finishedFraction()).toBe(1);
  });

  it("counts each file by what came of it", () => {
    const counts = new AccountCounts();
    counts.nextPost();
    counts.file("saved");
    counts.file("skipped");
    expect(counts.saved()).toBe(1);
    expect(counts.position()).toEqual({
      post: 1,
      total: undefined,
      counts: { saved: 1, skipped: 1, failed: 0 },
    });
    expect(counts.tally()).toEqual({ saved: 1, skipped: 1, failed: 0 });
  });
});
