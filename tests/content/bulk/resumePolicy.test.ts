import { FollowedAccountsResume } from "../../../src/content/bulk/resumePolicy";

const resume = new FollowedAccountsResume();

describe("FollowedAccountsResume", () => {
  it("begins over who is followed now and drops progress on accounts unfollowed since", () => {
    expect(
      resume.begin(
        {
          following: ["a", "gone", "b", "left", "c"],
          done: ["a", "gone"],
          completed: { a: 1, gone: 1 },
        },
        ["a", "b", "c"],
      ),
    ).toEqual({
      following: ["a", "b", "c"],
      done: ["a"],
      completed: { a: 1, gone: 1 },
    });
  });

  it("leaves the accounts not yet done, in order", () => {
    expect(
      resume.remaining({ following: null, done: ["b"], completed: {} }, [
        "a",
        "b",
        "c",
      ]),
    ).toEqual(["a", "c"]);
  });

  it("tells an account archived in full before from one that was not", () => {
    const state = { following: null, done: [], completed: { a: 1 } };
    expect(resume.archivedBefore(state, "a")).toBe(true);
    expect(resume.archivedBefore(state, "b")).toBe(false);
  });

  it("marks an account done and archived in full, leaving the old state alone", () => {
    const state = { following: ["a", "b"], done: ["a"], completed: { a: 1 } };
    expect(resume.accountDone(state, "b", 2)).toEqual({
      following: ["a", "b"],
      done: ["a", "b"],
      completed: { a: 1, b: 2 },
    });
    expect(state).toEqual({
      following: ["a", "b"],
      done: ["a"],
      completed: { a: 1 },
    });
  });

  it("finishes the run but keeps which accounts were archived in full", () => {
    expect(
      resume.finished({ following: ["a"], done: ["a"], completed: { a: 1 } }),
    ).toEqual({ following: null, done: [], completed: { a: 1 } });
  });
});
