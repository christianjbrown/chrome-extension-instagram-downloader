import {
  ChangeFolderCommand,
  DownloadAccountCommand,
  DownloadFollowingCommand,
  ProfilePictureCommand,
} from "../../../src/content/actions/profileCommands";
import type { BulkJob, BulkRunner } from "../../../src/content/bulk/bulkRunner";
import { fakeBridge, notifier, reporter, signal } from "../helpers";

const folder = {} as FileSystemDirectoryHandle;

function capturingRunner() {
  const jobs: BulkJob[] = [];
  const runner = {
    run: vi.fn((job: BulkJob) => (jobs.push(job), Promise.resolve())),
  };
  return { jobs, runner: runner as unknown as BulkRunner };
}

it("downloading an account archives it in full", async () => {
  const { jobs, runner } = capturingRunner();
  const archiver = {
    archive: vi.fn(() => Promise.resolve({ saved: 2, skipped: 1, failed: 0 })),
  };
  await new DownloadAccountCommand(runner, archiver).run("alice");
  const report = reporter();
  await expect(jobs[0]?.run(folder, signal(), report)).resolves.toBe(
    "Finished: 2 new files, 1 already exists.",
  );
  expect(jobs[0]?.title).toBe("Downloading alice");
  expect(archiver.archive).toHaveBeenCalledWith(
    expect.objectContaining({ username: "alice", onlyNew: false }),
  );
});

it("downloading following needs the signed-in account", async () => {
  const { jobs, runner } = capturingRunner();
  const following = { run: vi.fn(() => Promise.resolve("done")) };
  const viewers = {
    current: vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValue({ id: "1", username: "me" }),
  };
  const command = new DownloadFollowingCommand(runner, following, viewers);
  await command.run();
  await expect(jobs[0]?.run(folder, signal(), reporter())).rejects.toThrow(
    "Could not find your account.",
  );
  await expect(jobs[0]?.run(folder, signal(), reporter())).resolves.toBe(
    "done",
  );
});

describe("ProfilePictureCommand", () => {
  it("downloads the full-size profile picture", async () => {
    const downloader = { download: vi.fn(() => Promise.resolve()) };
    const bridge = fakeBridge({
      account: () => ({
        id: "9",
        username: "a",
        profilePicUrl: "https://cdn/p.jpg",
        totalPosts: 0,
      }),
    });
    await new ProfilePictureCommand(bridge, downloader, notifier()).run("a");
    expect(downloader.download).toHaveBeenCalledWith({
      id: "9_profile",
      username: "a",
      takenAt: 0,
      url: "https://cdn/p.jpg",
    });
  });

  it("explains a missing picture or a failed lookup", async () => {
    const notes = notifier();
    const noPicture = fakeBridge({
      account: () => ({
        id: "9",
        username: "a",
        profilePicUrl: undefined,
        totalPosts: 0,
      }),
    });
    await new ProfilePictureCommand(
      noPicture,
      { download: vi.fn() },
      notes,
    ).run("a");
    expect(notes.error).toHaveBeenCalledWith(
      "Could not download the profile picture: no picture",
    );
  });
});

describe("ChangeFolderCommand", () => {
  it("always shows the chooser", async () => {
    const folders = { pick: vi.fn(() => Promise.resolve(folder)) };
    await new ChangeFolderCommand(folders, notifier()).run();
    expect(folders.pick).toHaveBeenCalledWith(true);
  });

  it("says so when the folder was not changed", async () => {
    const notes = notifier();
    await new ChangeFolderCommand(
      { pick: () => Promise.reject(new Error("x")) },
      notes,
    ).run();
    expect(notes.error).toHaveBeenCalledWith(
      "The download folder was not changed.",
    );
  });
});
