import { EnglishRunWording } from "../../../src/content/bulk/progressText";
import { DownloadAccountCommand } from "../../../src/content/actions/downloadAccountCommand";
import { EnglishProfileWording } from "../../../src/content/actions/profileWording";
import { reporter, signal } from "../helpers";
import type { BulkJob, JobRunner } from "../../../src/content/bulk/ports";

const folder = {} as FileSystemDirectoryHandle;

it("downloading an account archives it in full", async () => {
  const jobs: BulkJob[] = [];
  const runner: JobRunner = {
    run: vi.fn((job: BulkJob) => (jobs.push(job), Promise.resolve())),
  };
  const archiver = {
    archive: vi.fn(() => Promise.resolve({ saved: 2, skipped: 1, failed: 0 })),
  };
  await new DownloadAccountCommand(
    runner,
    archiver,
    new EnglishRunWording(),
    new EnglishProfileWording(),
  ).run("alice");
  await expect(jobs[0]?.run(folder, signal(), reporter())).resolves.toBe(
    "Finished: 2 new files, 1 already exists.",
  );
  expect(jobs[0]?.title).toBe("Downloading alice");
  expect(archiver.archive).toHaveBeenCalledWith(
    expect.objectContaining({ username: "alice", onlyNew: false }),
  );
});
