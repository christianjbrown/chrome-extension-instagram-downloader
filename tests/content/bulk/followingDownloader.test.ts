import type { AccountArchiver } from "../../../src/content/bulk/accountArchiver";
import { ConsecutiveFailureTally } from "../../../src/content/bulk/failureTally";
import { FollowingDownloader } from "../../../src/content/bulk/followingDownloader";
import { FollowingLister } from "../../../src/content/bulk/followingLister";
import { RunStore } from "../../../src/content/bulk/runStore";
import { defaultPacing } from "../../../src/content/pacing/pacing";
import {
  MemoryFolder,
  asFolder,
  fakeBridge,
  reporter,
  signal,
} from "../helpers";

function setup(initial?: unknown) {
  const data: Record<string, unknown> =
    initial === undefined ? {} : { "followingDownload:1": initial };
  const store = new RunStore({
    get: (key) => Promise.resolve({ [key]: structuredClone(data[key]) }),
    set: (items) => {
      Object.assign(data, structuredClone(items));
      return Promise.resolve();
    },
  });
  const bridge = fakeBridge({
    followingPage: ({ next }) =>
      next === undefined
        ? { usernames: ["a", "b"], next: "n" }
        : { usernames: ["b", "c"], next: undefined },
  });
  const archiver = {
    archive: vi.fn((_request: { username: string }) =>
      Promise.resolve({ saved: 1, skipped: 0, failed: 0 }),
    ),
  };
  const pacer = {
    gate: { call: vi.fn((request: () => Promise<unknown>) => request()) },
    sleeper: { sleep: vi.fn(), between: vi.fn(() => Promise.resolve()) },
    pacing: defaultPacing,
  };
  const downloader = new FollowingDownloader({
    lister: new FollowingLister(bridge, pacer as never),
    archiver: archiver as unknown as AccountArchiver,
    store,
    now: () => 1234,
    tally: new ConsecutiveFailureTally(2),
  });
  const report = reporter();
  const run = () =>
    downloader.run({
      viewer: { id: "1", username: "me" },
      folder: asFolder(new MemoryFolder()),
      signal: signal(),
      reporter: report,
    });
  return { data, archiver, pacer, bridge, run, report };
}

describe("FollowingDownloader", () => {
  it("lists everyone followed, archives each straight after the last and clears the run", async () => {
    const { run, archiver, pacer, data, report } = setup();
    await expect(run()).resolves.toBe("Finished all 3 accounts you follow.");
    expect(report.overall.mock.calls).toEqual([
      ["Account 1 of 3 (0%)", 0],
      ["Account 2 of 3 (33%)", 1 / 3],
      ["Account 3 of 3 (66%)", 2 / 3],
    ]);
    expect(report.heading).toHaveBeenLastCalledWith("c");
    expect(
      archiver.archive.mock.calls.map(([request]) => request.username),
    ).toEqual(["a", "b", "c"]);
    expect(pacer.sleeper.between).not.toHaveBeenCalled();
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

  it("carries on a stopped run without listing again, and only fetches new posts for finished accounts", async () => {
    const { run, archiver, bridge } = setup({
      following: ["a", "b"],
      done: ["a"],
      completed: { a: 1, b: 1 },
    });
    await run();
    expect(bridge.call).not.toHaveBeenCalled();
    expect(archiver.archive).toHaveBeenCalledTimes(1);
    expect(archiver.archive).toHaveBeenCalledWith(
      expect.objectContaining({ username: "b", onlyNew: true }),
    );
  });

  it("carries on past an account that fails and names it at the end", async () => {
    const { run, archiver } = setup();
    archiver.archive.mockRejectedValueOnce(new Error("Account not found"));
    await expect(run()).resolves.toBe(
      "Finished all 3 accounts you follow. Could not read 1: a.",
    );
    expect(archiver.archive).toHaveBeenCalledTimes(3);
  });
});
