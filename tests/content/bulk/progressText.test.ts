import {
  describeAccount,
  describeAccountsFinished,
  describeCounts,
  describeProgress,
  percent,
} from "../../../src/content/bulk/progressText";

it("describes counts, mentioning failures only when there are some", () => {
  expect(describeCounts({ saved: 1, skipped: 1, failed: 0 })).toBe(
    "1 new file, 1 already exists",
  );
  expect(describeCounts({ saved: 8, skipped: 740, failed: 3 })).toBe(
    "8 new files, 740 already exist, 3 failed",
  );
});

it("counts posts against the account's total when it is known", () => {
  const counts = { saved: 8, skipped: 740, failed: 0 };
  expect(describeProgress(200, 948, counts)).toBe(
    "Post 200 of 948 (21%): 8 new files, 740 already exist",
  );
  expect(describeProgress(200, undefined, counts)).toBe(
    "Post 200: 8 new files, 740 already exist",
  );
  expect(describeProgress(949, 948, counts)).toBe(
    "Post 949: 8 new files, 740 already exist",
  );
});

it("counts accounts by those already finished", () => {
  expect(describeAccount(1, 120)).toBe("Account 1 of 120 (0%)");
  expect(describeAccount(61, 120)).toBe("Account 61 of 120 (50%)");
});

it("reaches a hundred percent once the last account is finished", () => {
  expect(describeAccountsFinished(109)).toBe("Account 109 of 109 (100%)");
});

it("only reaches a hundred percent at the end", () => {
  expect(percent(947, 948)).toBe(99);
  expect(percent(948, 948)).toBe(100);
  expect(percent(950, 948)).toBe(100);
});
