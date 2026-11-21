// Builds the parts of a bulk download.
import { AccountArchiver } from "./bulk/accountArchiver";
import { BulkRunner } from "./bulk/bulkRunner";
import { PinnedAwareCatchUp } from "./bulk/catchUp";
import { ConsecutiveFailureTally } from "./bulk/failureTally";
import { FollowingDownloader } from "./bulk/followingDownloader";
import { FollowingLister } from "./bulk/followingLister";
import { GatedPostTotals } from "./bulk/postTotals";
import { FollowedAccountsResume } from "./bulk/resumePolicy";
import {
  AnyStopPolicy,
  ReloadedExtensionPolicy,
  StopOrBlockPolicy,
} from "./bulk/stopPolicies";
import type { Pacer } from "./pacing/pacer";
import { RunStore } from "./bulk/runStore";
import { ApiGate } from "./pacing/apiGate";
import { HourlyBudget } from "./pacing/hourlyBudget";
import { TimerSleeper } from "./pacing/sleeper";
import { DirectoryWriter } from "./saving/directoryWriter";
import { blobFetcher } from "./saving/fetchBlob";
import { SafeFileNamer } from "./saving/fileNamer";
import { FolderPicker } from "./saving/folderPicker";
import { MemoryFolderStore } from "./saving/folderStore";
import { isMediaUrl } from "../shared/mediaUrl";
import { SecondCountdown } from "./ui/countdown";
import { ProgressPanel } from "./ui/progressPanel";
import { DomProgressBars } from "./ui/progressBar";
import type {
  Archiver,
  FollowingRunner,
  JobRunner,
  RunProgress,
} from "./bulk/ports";
import type { FetchBlob, FileNamer, FolderSource } from "./saving/ports";
import type { Wiring } from "./wiring";

/** What the features take from the bulk downloads. */
export interface BulkParts {
  readonly archiver: Archiver;
  readonly following: FollowingRunner;
  readonly folders: FolderSource;
  readonly runner: JobRunner;
  readonly runs: RunProgress;
  readonly fetchBlob: FetchBlob;
  readonly namer: FileNamer;
}

function bulkPacer({ config, scheduler }: Wiring): Pacer {
  const { pacing } = config;
  const sleeper = new TimerSleeper(scheduler, Math.random);
  const gate = new ApiGate(
    sleeper,
    new HourlyBudget(pacing.apiCallsPerHour, sleeper, Date.now),
    pacing,
  );
  return { gate, sleeper, fileDelayMs: pacing.fileDelayMs };
}

// The errors that end a run: a stop or a block anywhere, and for the
// following list also a reloaded extension, which fails every account after.
function stopPolicies() {
  const stopOrBlock = new StopOrBlockPolicy();
  return {
    stopOrBlock,
    any: new AnyStopPolicy([stopOrBlock, new ReloadedExtensionPolicy()]),
  };
}

// Runs each bulk download in the progress panel, one at a time.
function jobRunner(
  { env, scheduler, notifier, buttons, errors }: Wiring,
  folders: FolderSource,
): JobRunner {
  const { document } = env.window;
  return new BulkRunner({
    folders,
    panel: new ProgressPanel(
      document,
      new SecondCountdown(scheduler, Date.now),
      buttons,
      new DomProgressBars(document),
    ),
    notifier,
    controllerClass: env.window.AbortController,
    errors,
  });
}

export function bulk(wiring: Wiring): BulkParts {
  const { env, config, bridge, errors } = wiring;
  const pacer = bulkPacer(wiring);
  const namer = new SafeFileNamer();
  const fetchBlob = blobFetcher((url) => env.window.fetch(url), isMediaUrl);
  const writer = new DirectoryWriter(fetchBlob, namer);
  const stops = stopPolicies();
  const archiver = new AccountArchiver({
    files: wiring.files,
    bridge,
    writer,
    pacer,
    totals: new GatedPostTotals(bridge, pacer.gate, stops.stopOrBlock),
    catchUp: new PinnedAwareCatchUp(),
  });
  const runs = new RunStore(env.storage);
  const following = new FollowingDownloader({
    lister: new FollowingLister(bridge, pacer.gate),
    archiver,
    store: runs,
    resume: new FollowedAccountsResume(),
    now: Date.now,
    tally: new ConsecutiveFailureTally(
      config.failuresInARow,
      stops.any,
      errors,
    ),
  });
  const folders = new FolderPicker(new MemoryFolderStore(), (options) =>
    env.window.showDirectoryPicker(options),
  );
  const runner = jobRunner(wiring, folders);
  return { archiver, following, folders, runner, runs, fetchBlob, namer };
}
