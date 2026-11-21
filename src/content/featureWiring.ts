// Builds the features that add buttons to the page.
import { PostDownloader } from "./actions/postDownloader";
import {
  ChangeFolderCommand,
  DownloadAccountCommand,
  DownloadFollowingCommand,
  ProfilePictureCommand,
} from "./actions/profileCommands";
import { HighlightStories } from "./actions/highlightStories";
import { StoryDownloader } from "./actions/storyDownloader";
import { UserStories } from "./actions/userStories";
import { ViewerSource } from "./actions/viewerSource";
import type { Feature } from "./features/feature";
import { GridButtons } from "./features/gridButtons";
import { PostActions } from "./features/postActions";
import {
  ProfileToolbar,
  type ProfileCommands,
} from "./features/profileToolbar";
import { StoryToolbar } from "./features/storyToolbar";
import { PagePostLocator } from "./dom/postLocator";
import { VisibleAssetFinder } from "./dom/visibleAsset";
import { FileDownloader } from "./saving/fileDownloader";
import type { CurrentViewer } from "./actions/ports";
import type { ItemDownloader } from "./saving/ports";
import { AddressRoute } from "./dom/addressRoute";
import { DotCarousel } from "./dom/carousel";
import { GridThumbnails } from "./dom/gridThumbnails";
import { PathRouteParser } from "./dom/route";
import { PostPage, ProfilePage, StoryPage } from "./dom/routeKinds";

import { bulk, type BulkParts } from "./bulkWiring";
import type { ContentEnvironment, Wiring } from "./wiring";

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

// The readers of the address, one per kind of page a feature looks for.
function routes(env: ContentEnvironment) {
  const pathname = (): string => env.window.location.pathname;
  const parser = new PathRouteParser();
  return {
    posts: new AddressRoute(pathname, parser, new PostPage()),
    profiles: new AddressRoute(pathname, parser, new ProfilePage()),
    stories: new AddressRoute(pathname, parser, new StoryPage()),
  };
}

type Routes = ReturnType<typeof routes>;

// What the features share: the downloads, and how they read the page.
function shared(wiring: Wiring) {
  const { env, config, bridge, notifier } = wiring;
  const parts = bulk(wiring);
  const downloader = new FileDownloader(
    env.window.document,
    parts.fetchBlob,
    env.window.URL,
    parts.namer,
  );
  const assets = new VisibleAssetFinder(
    { viewportHeight: () => env.window.innerHeight },
    config.assetMinimumSide,
  );
  return {
    parts,
    downloader,
    assets,
    posts: new PostDownloader(bridge, downloader, notifier),
    viewers: new ViewerSource(bridge, Date.now, config.viewerRetryMs),
  };
}

function postFeatures(
  wiring: Wiring,
  { posts, assets }: ReturnType<typeof shared>,
  routes: Routes,
): Feature[] {
  const { env, config, notifier, buttons } = wiring;
  const { document } = env.window;
  const carousel = new DotCarousel();
  return [
    new PostActions({
      document,
      downloader: posts,
      notifier,
      locator: new PagePostLocator(routes.posts, assets, carousel),
      carousel,
      buttons,
    }),
    new GridButtons(
      new GridThumbnails(document, config.gridMinimumWidth),
      posts,
      routes.profiles,
      buttons,
    ),
  ];
}

function accountFeatures(
  wiring: Wiring,
  { parts, downloader, assets, viewers }: ReturnType<typeof shared>,
  routes: Routes,
): Feature[] {
  const { env, bridge, notifier, buttons } = wiring;
  const { document } = env.window;
  return [
    new ProfileToolbar({
      document,
      commands: profileCommands(wiring, parts, viewers, downloader),
      viewers,
      runs: parts.runs,
      profiles: routes.profiles,
      buttons,
    }),
    new StoryToolbar({
      document,
      downloader: new StoryDownloader(bridge, downloader, notifier, [
        new UserStories(bridge),
        new HighlightStories(bridge),
      ]),
      assets,
      stories: routes.stories,
      buttons,
    }),
  ];
}

export function features(wiring: Wiring): Feature[] {
  const parts = shared(wiring);
  const pages = routes(wiring.env);
  return [
    ...postFeatures(wiring, parts, pages),
    ...accountFeatures(wiring, parts, pages),
  ];
}
