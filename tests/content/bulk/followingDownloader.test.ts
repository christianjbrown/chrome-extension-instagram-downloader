import type { FollowingPage } from "../../../src/shared/bridge";
import { ConsecutiveFailureTally } from "../../../src/content/bulk/failureTally";
import { StopOrBlockPolicy } from "../../../src/content/bulk/stopPolicies";
import { FollowingDownloader } from "../../../src/content/bulk/followingDownloader";
import { FollowingLister } from "../../../src/content/bulk/followingLister";
import type { ResumePolicy } from "../../../src/content/bulk/ports";
import { RunStore } from "../../../src/content/bulk/runStore";
import type { RunState } from "../../../src/content/bulk/runState";
import {
  MemoryFolder,
  asFolder,
  fakeBridge,
  reporter,
  signal,
} from "../helpers";

const twoPages = ({ next }: { next: string | undefined }): FollowingPage =>
  next === undefined
    ? { usernames: ["a", "b"], next: "n" }
    : { usernames: ["b", "c"], next: undefined };

// Resumes without dropping anyone, so these tests only see what the
// downloader does with the policy's answers.
const fakeResume = (): ResumePolicy => ({
  begin: vi.fn((state: RunState, following: string[]) => ({
    ...state,
    following,
  })),
  remaining: vi.fn((state: RunState, following: string[]) =>
    following.filter((name) => !state.done.includes(name)),
  ),
  finished: vi.fn((state: RunState) => ({
    ...state,
    following: null,
    done: [],
  })),
});

function setup(
  initial?: unknown,
  followingPage = twoPages,
  resume = fakeResume(),
) {
  const data: Record<string, unknown> =
    initial === undefined ? {} : { "followingDownload:1": initial };
  const store = new RunStore({
    get: (key) => Promise.resolve({ [key]: structuredClone(data[key]) }),
    set: (items) => {
      Object.assign(data, structuredClone(items));
      return Promise.resolve();
    },
  });
  const bridge = fakeBridge({ followingPage });
  const archiver = {
    archive: vi.fn((_request: { username: string }) =>
      Promise.resolve({ saved: 1, skipped: 0, failed: 0 }),
    ),
  };
  const gate = {
    call: vi.fn((request: () => Promise<unknown>) => request()),
  };
  const downloader = new FollowingDownloader({
    lister: new FollowingLister(bridge, gate as never),
    archiver: archiver,
    store,
    resume,
    now: () => 1234,
    tally: new ConsecutiveFailureTally(2, new StopOrBlockPolicy()),
  });
  const report = reporter();
  const run = () =>
    downloader.run({
      viewer: { id: "1", username: "me" },
      folder: asFolder(new MemoryFolder()),
      signal: signal(),
      reporter: report,
    });
  return { data, archiver, gate, bridge, run, report };
}

describe("FollowingDownloader", () => {
  it("lists everyone followed, archives each straight after the last and clears the run", async () => {
    const { run, archiver, gate, data, report } = setup();
    await expect(run()).resolves.toBe("Finished all 3 accounts you follow.");
    expect(report.overall.mock.calls).toEqual([
      ["Account 1 of 3 (0%)", 0],
      ["Account 2 of 3 (33%)", 1 / 3],
      ["Account 3 of 3 (66%)", 2 / 3],
      ["Account 3 of 3 (100%)", 1],
    ]);
    expect(report.heading).toHaveBeenLastCalledWith("c");
    expect(
      archiver.archive.mock.calls.map(([request]) => request.username),
    ).toEqual(["a", "b", "c"]);
    // Only the two pages of the list are paced; accounts follow straight on.
    expect(gate.call).toHaveBeenCalledTimes(2);
    expect(data["followingDownload:1"]).toMatchObject({
      following: null,
      done: [],
    });
    expect(
      Object.keys(
        (data["followingDownload:1"] as { completed: object }).completed,
      ),
    ).toEqual(["a", "b", "c"]);
    expect(
      (data["followingDownload:1"] as { completed: object }).completed,
    ).toEqual({ a: 1234, b: 1234, c: 1234 });
  });

  it("carries on a stopped run, and only fetches new posts for finished accounts", async () => {
    const { run, archiver, report } = setup({
      following: ["a", "b", "c"],
      done: ["a", "b"],
      completed: { a: 1, b: 1, c: 1 },
    });
    await run();
    expect(archiver.archive).toHaveBeenCalledTimes(1);
    expect(archiver.archive).toHaveBeenCalledWith(
      expect.objectContaining({ username: "c", onlyNew: true }),
    );
    expect(report.overall.mock.calls).toEqual([
      ["Account 3 of 3 (66%)", 2 / 3],
      ["Account 3 of 3 (100%)", 1],
    ]);
  });

  it("archives what the resume policy leaves and stores what it begins and finishes", async () => {
    const begun: RunState = { following: ["x"], done: [], completed: {} };
    const ended: RunState = { following: null, done: [], completed: {} };
    const resume: ResumePolicy = {
      begin: vi.fn(() => begun),
      remaining: vi.fn(() => ["c"]),
      finished: vi.fn(() => ended),
    };
    const stored = { following: ["a"], done: ["a"], completed: { a: 1 } };
    const { run, archiver, data } = setup(stored, twoPages, resume);
    await run();
    expect(resume.begin).toHaveBeenCalledWith(stored, ["a", "b", "c"]);
    expect(resume.remaining).toHaveBeenCalledWith(begun, ["a", "b", "c"]);
    expect(resume.finished).toHaveBeenCalledWith(begun);
    expect(
      archiver.archive.mock.calls.map(([request]) => request.username),
    ).toEqual(["c"]);
    expect(data["followingDownload:1"]).toEqual(ended);
  });

  it("carries on past an account that fails and names it at the end", async () => {
    const { run, archiver } = setup();
    archiver.archive.mockRejectedValueOnce(new Error("Account not found"));
    await expect(run()).resolves.toBe(
      "Finished all 3 accounts you follow. Could not read 1: a.",
    );
    expect(archiver.archive).toHaveBeenCalledTimes(3);
  });

  it("leaves the overall line alone when nobody is followed", async () => {
    const { run, report } = setup(undefined, () => ({
      usernames: [],
      next: undefined,
    }));
    await expect(run()).resolves.toBe("Finished all 0 accounts you follow.");
    expect(report.overall).not.toHaveBeenCalled();
  });
});
