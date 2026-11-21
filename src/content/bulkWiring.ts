// Builds the parts of a bulk download.
import { AccountArchiver } from "./bulk/accountArchiver";
import { CatchingUpPages } from "./bulk/accountPages";
import { BarTallies } from "./bulk/accountTally";
import { BulkRunner } from "./bulk/bulkRunner";
import { PinnedAwareCatchUp } from "./bulk/catchUp";
import { ConsecutiveFailureTally } from "./bulk/failureTally";
import { FollowingDownloader } from "./bulk/followingDownloader";
import { FollowingLister } from "./bulk/followingLister";
import { PanelFollowingProgress } from "./bulk/followingProgress";
import { PacedItemSaver } from "./bulk/itemSaver";
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
import { WindowDirectoryPicker } from "./saving/windowPicker";
import { StoppedRunWording, WordedErrors } from "./errorText";
import { SecondCountdown } from "./ui/countdown";
import { CountdownLine } from "./ui/countdownLine";
import { EnglishPanelWording } from "./ui/panelWording";
import { progressPanel } from "./panelWiring";
import type {
  Archiver,
  CountsWording,
  FollowingRunner,
  JobRunner,
  RunProgress,
  RunStateStore,
} from "./bulk/ports";
import { EnglishRunWording } from "./bulk/progressText";
import type {
  FetchBlob,
  FileNamer,
  FolderSource,
  ItemWriter,
} from "./saving/ports";
import type { ContentEnvironment, Wiring } from "./wiring";

// The words of every bulk download.
const RUN_WORDING = new EnglishRunWording();

/** What the features take from the bulk downloads. */
export interface BulkParts {
  readonly archiver: Archiver;
  readonly following: FollowingRunner;
  readonly folders: FolderSource;
  readonly runner: JobRunner;
  readonly runs: RunProgress;
  readonly fetchBlob: FetchBlob;
  readonly namer: FileNamer;
  readonly wording: CountsWording;
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
  const wording = new EnglishPanelWording();
  return new BulkRunner({
    folders,
    panel: progressPanel(
      document,
      buttons,
      new CountdownLine(new SecondCountdown(scheduler, Date.now), wording),
      wording,
    ),
    notifier,
    controllerClass: env.window.AbortController,
    // A stop ends a run on purpose, so the panel says how to carry on.
    errors: new WordedErrors([new StoppedRunWording()], errors),
  });
}

// The download folder, chosen through Chrome's own folder chooser.
function folderSource(env: ContentEnvironment): FolderSource {
  const picker = new WindowDirectoryPicker(
    env.window,
    env.window.FileSystemDirectoryHandle,
  );
  return new FolderPicker(new MemoryFolderStore(), (options) =>
    picker.show(options),
  );
}

type Stops = ReturnType<typeof stopPolicies>;

// Saves one account's posts, paced, counting what it saved.
function accountArchiver(
  wiring: Wiring,
  pacer: Pacer,
  writer: ItemWriter,
  stops: Stops,
): Archiver {
  const { bridge } = wiring;
  return new AccountArchiver({
    files: wiring.files,
    pages: new CatchingUpPages({
      bridge,
      gate: pacer.gate,
      totals: new GatedPostTotals(bridge, pacer.gate, stops.stopOrBlock),
      catchUp: new PinnedAwareCatchUp(),
    }),
    saver: new PacedItemSaver(writer, pacer.sleeper, pacer.fileDelayMs),
    tallies: new BarTallies(RUN_WORDING),
  });
}

// Archives every account the viewer follows, keeping its place in storage.
function followingRunner(
  { bridge, config, errors }: Wiring,
  pacer: Pacer,
  { archiver, runs }: { archiver: Archiver; runs: RunStateStore },
  stops: Stops,
): FollowingRunner {
  return new FollowingDownloader({
    lister: new FollowingLister(bridge, pacer.gate),
    archiver,
    store: runs,
    resume: new FollowedAccountsResume(),
    now: Date.now,
    tally: new ConsecutiveFailureTally(
      config.failuresInARow,
      stops.any,
      errors,
      RUN_WORDING,
    ),
    progress: new PanelFollowingProgress(RUN_WORDING),
  });
}

export function bulk(wiring: Wiring): BulkParts {
  const { env, mediaUrls } = wiring;
  const pacer = bulkPacer(wiring);
  const namer = new SafeFileNamer();
  const fetchBlob = blobFetcher((url) => env.window.fetch(url), mediaUrls);
  const stops = stopPolicies();
  const archiver = accountArchiver(
    wiring,
    pacer,
    new DirectoryWriter(fetchBlob, namer),
    stops,
  );
  const runs = new RunStore(env.storage);
  const following = followingRunner(wiring, pacer, { archiver, runs }, stops);
  const folders = folderSource(env);
  const runner = jobRunner(wiring, folders);
  return {
    archiver,
    following,
    folders,
    runner,
    runs,
    fetchBlob,
    namer,
    wording: RUN_WORDING,
  };
}
