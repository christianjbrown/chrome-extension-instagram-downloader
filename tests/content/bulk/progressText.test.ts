import {
  EnglishRunWording,
  percent,
} from "../../../src/content/bulk/progressText";

const wording = new EnglishRunWording();

it("describes counts, mentioning failures only when there are some", () => {
  expect(wording.counts({ saved: 1, skipped: 1, failed: 0 })).toBe(
    "1 new file, 1 already exists",
  );
  expect(wording.counts({ saved: 8, skipped: 740, failed: 3 })).toBe(
    "8 new files, 740 already exist, 3 failed",
  );
});

it("counts posts against the account's total when it is known", () => {
  const counts = { saved: 8, skipped: 740, failed: 0 };
  expect(wording.progress(200, 948, counts)).toBe(
    "Post 200 of 948 (21%): 8 new files, 740 already exist",
  );
  expect(wording.progress(200, undefined, counts)).toBe(
    "Post 200: 8 new files, 740 already exist",
  );
  expect(wording.progress(949, 948, counts)).toBe(
    "Post 949: 8 new files, 740 already exist",
  );
});

it("counts accounts by those already finished", () => {
  expect(wording.account(1, 120)).toBe("Account 1 of 120 (0%)");
  expect(wording.account(61, 120)).toBe("Account 61 of 120 (50%)");
});

it("reaches a hundred percent once the last account is finished", () => {
  expect(wording.accountsFinished(109)).toBe("Account 109 of 109 (100%)");
});

it("only reaches a hundred percent at the end", () => {
  expect(percent(947, 948)).toBe(99);
  expect(percent(948, 948)).toBe(100);
  expect(percent(950, 948)).toBe(100);
});

it("says when every account the viewer follows is finished", () => {
  expect(wording.followingFinished(3)).toBe(
    "Finished all 3 accounts you follow.",
  );
});
