// Builds the content script's object graph. The only place classes are
// constructed; everything else receives what it needs.
import { PostDownloader } from "./actions/postDownloader";
import {
  ChangeFolderCommand,
  DownloadAccountCommand,
  DownloadFollowingCommand,
  ProfilePictureCommand,
} from "./actions/profileCommands";
import { StoryDownloader } from "./actions/storyDownloader";
import { ViewerSource } from "./actions/viewerSource";
import { PageBridge } from "./bridgeClient";
import { AccountArchiver } from "./bulk/accountArchiver";
import { BulkRunner } from "./bulk/bulkRunner";
import { PinnedAwareCatchUp } from "./bulk/catchUp";
import { ConsecutiveFailureTally } from "./bulk/failureTally";
import { FollowingDownloader } from "./bulk/followingDownloader";
import { FollowingLister } from "./bulk/followingLister";
import { GatedPostTotals } from "./bulk/postTotals";
import type { Pacer } from "./pacing/pacer";
import { RunStore, type KeyValueArea } from "./bulk/runStore";
import type { Feature, PageView } from "./features/feature";
import { GridButtons } from "./features/gridButtons";
import { PageScanner } from "./features/pageScanner";
import { PostActions } from "./features/postActions";
import {
  ProfileToolbar,
  type ProfileCommands,
} from "./features/profileToolbar";
import { StoryToolbar } from "./features/storyToolbar";
import { ApiGate } from "./pacing/apiGate";
import { HourlyBudget } from "./pacing/hourlyBudget";
import type { ContentConfig } from "./config";
import { VisibleAssetFinder } from "./dom/visibleAsset";
import { TimerSleeper } from "./pacing/sleeper";
import { DirectoryWriter } from "./saving/directoryWriter";
import { blobFetcher } from "./saving/fetchBlob";
import { SafeFileNamer } from "./saving/fileNamer";
import { FileDownloader } from "./saving/fileDownloader";
import { FolderPicker, type ShowDirectoryPicker } from "./saving/folderPicker";
import { MemoryFolderStore } from "./saving/folderStore";
import { LegacyFolderDatabase } from "./saving/legacyFolderDatabase";
import { pageOrigin } from "../shared/origin";
import { isMediaUrl } from "../shared/mediaUrl";
import { ValidatedBridge } from "./validatedBridge";
import { TimeoutScheduler } from "./scheduler";
import { ToastNotifier } from "./ui/notifier";
import { SecondCountdown } from "./ui/countdown";
import { ProgressPanel } from "./ui/progressPanel";
import type { CurrentViewer } from "./actions/ports";
import type { Bridge, Scheduler } from "./ports";
import type { ItemDownloader } from "./saving/ports";
import type { Notifier } from "./ui/ports";

export interface ContentEnvironment {
  readonly window: Window &
    typeof globalThis & { showDirectoryPicker: ShowDirectoryPicker };
  readonly storage: KeyValueArea;
}

// What every part of the graph is built from.
interface Wiring {
  readonly env: ContentEnvironment;
  readonly config: ContentConfig;
  readonly scheduler: Scheduler;
  readonly bridge: Bridge;
  readonly notifier: Notifier;
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

function bulk(wiring: Wiring) {
  const { env, config, bridge, notifier, scheduler } = wiring;
  const pacer = bulkPacer(wiring);
  const namer = new SafeFileNamer();
  const fetchBlob = blobFetcher((url) => env.window.fetch(url), isMediaUrl);
  const writer = new DirectoryWriter(fetchBlob, namer);
  const archiver = new AccountArchiver({
    bridge,
    writer,
    pacer,
    totals: new GatedPostTotals(bridge, pacer.gate),
    catchUp: new PinnedAwareCatchUp(),
  });
  const runs = new RunStore(env.storage);
  const following = new FollowingDownloader({
    lister: new FollowingLister(bridge, pacer.gate),
    archiver,
    store: runs,
    now: Date.now,
    tally: new ConsecutiveFailureTally(config.failuresInARow),
  });
  const folders = new FolderPicker(new MemoryFolderStore(), (options) =>
    env.window.showDirectoryPicker(options),
  );
  const runner = new BulkRunner(
    folders,
    new ProgressPanel(
      env.window.document,
      new SecondCountdown(scheduler, Date.now),
    ),
    notifier,
    env.window.AbortController,
  );
  return { archiver, following, folders, runner, runs, fetchBlob, namer };
}

function pageBridge(
  env: ContentEnvironment,
  config: ContentConfig,
  scheduler: Scheduler,
): Bridge {
  return new ValidatedBridge(
    new PageBridge(
      (message, origin, transfer) => {
        env.window.postMessage(message, origin, transfer);
      },
      {
        pageOrigin,
        newChannel: () => new env.window.MessageChannel(),
        scheduler,
        timeoutMs: config.bridgeTimeoutMs,
      },
    ),
  );
}

type BulkParts = ReturnType<typeof bulk>;

function profileCommands(
  { bridge, notifier }: Wiring,
  parts: BulkParts,
  viewers: CurrentViewer,
  downloader: ItemDownloader,
): ProfileCommands {
  return {
    account: new DownloadAccountCommand(parts.runner, parts.archiver),
    following: new DownloadFollowingCommand(
      parts.runner,
      parts.following,
      viewers,
    ),
    picture: new ProfilePictureCommand(bridge, downloader, notifier),
    folder: new ChangeFolderCommand(parts.folders, notifier),
  };
}

function features(wiring: Wiring): Feature[] {
  const { env, config, bridge, notifier } = wiring;
  const { document } = env.window;
  const view: PageView = {
    document,
    pathname: () => env.window.location.pathname,
  };
  const assets = new VisibleAssetFinder(
    { viewportHeight: () => env.window.innerHeight },
    config.assetMinimumSide,
  );
  const parts = bulk(wiring);
  const downloader = new FileDownloader(
    document,
    parts.fetchBlob,
    env.window.URL,
    parts.namer,
  );
  const posts = new PostDownloader(bridge, downloader, notifier);
  const viewers = new ViewerSource(bridge, Date.now, config.viewerRetryMs);
  const commands = profileCommands(wiring, parts, viewers, downloader);
  return [
    new PostActions(view, posts, notifier, assets),
    new GridButtons(view, posts, config.gridMinimumWidth),
    new ProfileToolbar(view, commands, viewers, parts.runs),
    new StoryToolbar(
      view,
      new StoryDownloader(bridge, downloader, notifier),
      assets,
    ),
  ];
}

export function startContent(
  env: ContentEnvironment,
  config: ContentConfig,
): void {
  const { document } = env.window;
  new LegacyFolderDatabase(env.window.indexedDB).remove();
  const scheduler = new TimeoutScheduler(env.window);
  const notifier = new ToastNotifier(
    document,
    scheduler,
    config.toastLifetimeMs,
  );
  const bridge = pageBridge(env, config, scheduler);
  const wiring = { env, config, scheduler, bridge, notifier };
  new PageScanner(features(wiring), scheduler, config.scanDelayMs).start(
    document.body,
    (callback) => new env.window.MutationObserver(callback),
  );
}
