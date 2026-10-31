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
import { FollowingDownloader } from "./bulk/followingDownloader";
import { RunStore, type KeyValueArea } from "./bulk/runStore";
import type { Feature, PageView } from "./features/feature";
import { GridButtons } from "./features/gridButtons";
import { PageScanner } from "./features/pageScanner";
import { PostActions } from "./features/postActions";
import { ProfileToolbar } from "./features/profileToolbar";
import { StoryToolbar } from "./features/storyToolbar";
import { ApiGate } from "./pacing/apiGate";
import { HourlyBudget } from "./pacing/hourlyBudget";
import { defaultPacing } from "./pacing/pacing";
import { TimerSleeper } from "./pacing/sleeper";
import { DirectoryWriter } from "./saving/directoryWriter";
import { blobFetcher } from "./saving/fetchBlob";
import { FileDownloader } from "./saving/fileDownloader";
import { FolderPicker, type ShowDirectoryPicker } from "./saving/folderPicker";
import { IndexedDbFolderStore } from "./saving/folderStore";
import { pageOrigin } from "../shared/bridge";
import { isMediaUrl } from "../shared/mediaUrl";
import { ValidatedBridge } from "./validatedBridge";
import { TimeoutScheduler, type Scheduler } from "./scheduler";
import { ToastNotifier } from "./ui/notifier";
import { ProgressPanel } from "./ui/progressPanel";

export interface ContentEnvironment {
  readonly window: Window &
    typeof globalThis & { showDirectoryPicker: ShowDirectoryPicker };
  readonly storage: KeyValueArea;
}

function bulk(
  env: ContentEnvironment,
  bridge: Bridge,
  notifier: ToastNotifier,
) {
  const sleeper = new TimerSleeper();
  const gate = new ApiGate(
    sleeper,
    new HourlyBudget(defaultPacing.apiCallsPerHour, sleeper, Date.now),
    defaultPacing,
  );
  const fetchBlob = blobFetcher((url) => env.window.fetch(url), isMediaUrl);
  const writer = new DirectoryWriter(fetchBlob);
  const pacer = { gate, sleeper, pacing: defaultPacing };
  const archiver = new AccountArchiver(bridge, writer, pacer);
  const runs = new RunStore(env.storage);
  const following = new FollowingDownloader(bridge, archiver, runs, pacer);
  const folders = new FolderPicker(
    new IndexedDbFolderStore(env.window.indexedDB),
    (options) => env.window.showDirectoryPicker(options),
  );
  const runner = new BulkRunner(
    folders,
    new ProgressPanel(env.window.document),
    notifier,
    env.window.AbortController,
  );
  return { archiver, following, folders, runner, runs, fetchBlob };
}

function pageBridge(env: ContentEnvironment, scheduler: Scheduler): Bridge {
  return new ValidatedBridge(
    new PageBridge(
      (message, origin, transfer) => {
        env.window.postMessage(message, origin, transfer);
      },
      {
        pageOrigin,
        newChannel: () => new env.window.MessageChannel(),
        scheduler,
      },
    ),
  );
}

function features(
  env: ContentEnvironment,
  bridge: Bridge,
  notifier: ToastNotifier,
): Feature[] {
  const { document } = env.window;
  const view: PageView = {
    document,
    pathname: () => env.window.location.pathname,
    viewportHeight: () => env.window.innerHeight,
  };
  const parts = bulk(env, bridge, notifier);
  const downloader = new FileDownloader(
    document,
    parts.fetchBlob,
    env.window.URL,
  );
  const posts = new PostDownloader(bridge, downloader, notifier);
  const viewers = new ViewerSource(bridge, Date.now);
  const commands = {
    account: new DownloadAccountCommand(parts.runner, parts.archiver),
    following: new DownloadFollowingCommand(
      parts.runner,
      parts.following,
      viewers,
    ),
    picture: new ProfilePictureCommand(bridge, downloader, notifier),
    folder: new ChangeFolderCommand(parts.folders, notifier),
  };
  return [
    new PostActions(view, posts, notifier),
    new GridButtons(view, posts),
    new ProfileToolbar(view, commands, viewers, parts.runs),
    new StoryToolbar(view, new StoryDownloader(bridge, downloader, notifier)),
  ];
}

export function startContent(env: ContentEnvironment): void {
  const { document } = env.window;
  const scheduler = new TimeoutScheduler();
  const notifier = new ToastNotifier(document, scheduler);
  const bridge = pageBridge(env, scheduler);
  new PageScanner(features(env, bridge, notifier), scheduler).start(
    document.body,
    (callback) => new env.window.MutationObserver(callback),
  );
}
