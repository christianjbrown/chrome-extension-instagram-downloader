// Downloads every post of the profile the button sits on.
import type {
  Archiver,
  BulkJob,
  CountsWording,
  JobRunner,
} from "../bulk/ports";
import type { AccountJobWording, UsernameCommand } from "./ports";

export class DownloadAccountCommand implements UsernameCommand {
  constructor(
    private readonly runner: JobRunner,
    private readonly archiver: Archiver,
    private readonly counts: CountsWording,
    private readonly wording: AccountJobWording,
  ) {}

  run(username: string): Promise<void> {
    const job: BulkJob = {
      title: this.wording.accountTitle(username),
      run: async (folder, signal, reporter) => {
        reporter.heading(username);
        const counts = await this.archiver.archive({
          username,
          folder,
          onlyNew: false,
          signal,
          reporter,
        });
        return this.wording.accountFinished(this.counts.counts(counts));
      },
    };
    return this.runner.run(job);
  }
}
