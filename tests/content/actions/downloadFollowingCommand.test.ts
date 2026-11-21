import { DownloadFollowingCommand } from "../../../src/content/actions/downloadFollowingCommand";
import { EnglishProfileWording } from "../../../src/content/actions/profileWording";
import { reporter, signal } from "../helpers";
import type { BulkJob, JobRunner } from "../../../src/content/bulk/ports";

const folder = {} as FileSystemDirectoryHandle;

it("downloading following needs the signed-in account", async () => {
  const jobs: BulkJob[] = [];
  const runner: JobRunner = {
    run: vi.fn((job: BulkJob) => (jobs.push(job), Promise.resolve())),
  };
  const following = { run: vi.fn(() => Promise.resolve("done")) };
  const viewers = {
    current: vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValue({ id: "1", username: "me" }),
  };
  await new DownloadFollowingCommand(
    runner,
    following,
    viewers,
    new EnglishProfileWording(),
  ).run();
  expect(jobs[0]?.title).toBe("Downloading accounts you follow");
  await expect(jobs[0]?.run(folder, signal(), reporter())).rejects.toThrow(
    "Could not find your account.",
  );
  await expect(jobs[0]?.run(folder, signal(), reporter())).resolves.toBe(
    "done",
  );
});
