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
import { type Bridge, PageBridge } from "./bridgeClient";
import { AccountArchiver } from "./bulk/accountArchiver";
import { BulkRunner } from "./bulk/bulkRunner";
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
import { TimeoutScheduler, type Scheduler } from "./scheduler";
import { ToastNotifier } from "./ui/notifier";
import { SecondCountdown } from "./ui/countdown";
import { ProgressPanel } from "./ui/progressPanel";

export interface ContentEnvironment {
  readonly window: Window &
    typeof globalThis & { showDirectoryPicker: ShowDirectoryPicker };
  readonly storage: KeyValueArea;
}

function bulkPacer({ pacing }: ContentConfig): Pacer {
  const sleeper = new TimerSleeper();
  const gate = new ApiGate(
    sleeper,
    new HourlyBudget(pacing.apiCallsPerHour, sleeper, Date.now),
    pacing,
  );
  return { gate, sleeper, pacing };
}

function bulk(
  env: ContentEnvironment,
  config: ContentConfig,
  bridge: Bridge,
  notifier: ToastNotifier,
) {
  const pacer = bulkPacer(config);
  const namer = new SafeFileNamer();
  const fetchBlob = blobFetcher((url) => env.window.fetch(url), isMediaUrl);
  const writer = new DirectoryWriter(fetchBlob, namer);
  const archiver = new AccountArchiver(
    bridge,
    writer,
    pacer,
    new GatedPostTotals(bridge, pacer.gate),
  );
  const runs = new RunStore(env.storage);
  const following = new FollowingDownloader({
    lister: new FollowingLister(bridge, pacer),
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
      new SecondCountdown(new TimeoutScheduler(), Date.now),
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

interface SingleDownloads {
  readonly bridge: Bridge;
  readonly downloader: FileDownloader;
  readonly notifier: ToastNotifier;
}

function profileCommands(
  parts: BulkParts,
  viewers: ViewerSource,
  { bridge, downloader, notifier }: SingleDownloads,
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

function features(
  env: ContentEnvironment,
  config: ContentConfig,
  bridge: Bridge,
  notifier: ToastNotifier,
): Feature[] {
  const { document } = env.window;
  const view: PageView = {
    document,
    pathname: () => env.window.location.pathname,
  };
  const assets = new VisibleAssetFinder(
    { viewportHeight: () => env.window.innerHeight },
    config.assetMinimumSide,
  );
  const parts = bulk(env, config, bridge, notifier);
  const downloader = new FileDownloader(
    document,
    parts.fetchBlob,
    env.window.URL,
    parts.namer,
  );
  const posts = new PostDownloader(bridge, downloader, notifier);
  const viewers = new ViewerSource(bridge, Date.now, config.viewerRetryMs);
  const commands = profileCommands(parts, viewers, {
    bridge,
    downloader,
    notifier,
  });
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
  const scheduler = new TimeoutScheduler();
  const notifier = new ToastNotifier(
    document,
    scheduler,
    config.toastLifetimeMs,
  );
  const bridge = pageBridge(env, config, scheduler);
  new PageScanner(
    features(env, config, bridge, notifier),
    scheduler,
    config.scanDelayMs,
  ).start(
    document.body,
    (callback) => new env.window.MutationObserver(callback),
  );
}
