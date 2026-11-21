import type { Viewer } from "../../shared/bridge";
import type { ResumableRun, RunProgress } from "./ports";

// A following run can be resumed when one was stopped part way.
export class StoppedFollowingRun implements ResumableRun {
  constructor(private readonly runs: RunProgress) {}

  canResume(viewer: Viewer): Promise<boolean> {
    return this.runs.inProgress(viewer.id);
  }
}
