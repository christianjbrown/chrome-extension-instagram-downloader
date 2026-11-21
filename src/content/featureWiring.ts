// Builds the features that add buttons to the page.
import { FirstKeyFinder } from "./actions/mediaFinder";
import { AssetLookup, MediaIdLookup } from "./actions/mediaLookups";
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
import type { Feature, ProfileButton } from "./features/feature";
import { GridButtons } from "./features/gridButtons";
import { PostActions } from "./features/postActions";
import { PostTargetDownload } from "./features/postTargetDownload";
import { ProfileToolbar } from "./features/profileToolbar";
import { StoryToolbar } from "./features/storyToolbar";
import { AllStoriesButton, CurrentStoryButton } from "./features/storyButtons";
import { PagePostLocator } from "./dom/postLocator";
import { VisibleAssetFinder } from "./dom/visibleAsset";
import { FileDownloader } from "./saving/fileDownloader";
import type { CurrentViewer } from "./actions/ports";
import type { ItemDownloader } from "./saving/ports";
import { DotCarousel } from "./dom/carousel";
import { GridThumbnails } from "./dom/gridThumbnails";
import { routes, type Routes } from "./routeWiring";
import { TextButtonClasses } from "./ui/buttons";

import { SignedInProfile } from "./actions/ownProfile";
import { StoppedFollowingRun } from "./bulk/resumableRun";
import { AllSlidesButton, ShowingSlideButton } from "./features/postButtons";
import { CommandButton, FollowingButton } from "./features/profileButtons";
import { BUTTON_LOOKS } from "./buttonLooks";
import { bulk, type BulkParts } from "./bulkWiring";
import type { Wiring } from "./wiring";

// The buttons under a profile's header, in the order they appear.
function profileButtons(
  { bridge, notifier, errors }: Wiring,
  parts: BulkParts,
  viewers: CurrentViewer,
  downloader: ItemDownloader,
): ProfileButton[] {
  return [
    new CommandButton(
      BUTTON_LOOKS.downloadAll,
      new DownloadAccountCommand(parts.runner, parts.archiver, parts.wording),
    ),
    new CommandButton(
      BUTTON_LOOKS.picture,
      new ProfilePictureCommand(bridge, downloader, notifier, errors),
    ),
    new CommandButton(
      BUTTON_LOOKS.folder,
      new ChangeFolderCommand(parts.folders, notifier),
    ),
    new FollowingButton(
      new DownloadFollowingCommand(parts.runner, parts.following, viewers),
      new SignedInProfile(viewers),
      new StoppedFollowingRun(parts.runs),
      {
        start: BUTTON_LOOKS.following,
        resume: BUTTON_LOOKS.resumeFollowing,
      },
    ),
  ];
}

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
  // A post or story is found by its id first, then by the picture on screen.
  const finder = new FirstKeyFinder([
    new MediaIdLookup(bridge),
    new AssetLookup(bridge),
  ]);
  return {
    parts,
    downloader,
    assets,
    finder,
    posts: new PostDownloader({
      finder,
      downloader,
      notifier,
      files: wiring.files,
      errors: wiring.errors,
    }),
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
      action: new PostTargetDownload(
        new PagePostLocator(routes.posts, assets, carousel),
        posts,
        notifier,
      ),
      postButtons: [new ShowingSlideButton(), new AllSlidesButton(carousel)],
      buttons,
    }),
    new GridButtons(
      new GridThumbnails(
        document,
        config.gridMinimumWidth,
        env.window.HTMLAnchorElement,
      ),
      posts,
      routes.profiles,
      buttons,
    ),
  ];
}

function accountFeatures(
  wiring: Wiring,
  { parts, downloader, assets, viewers, finder }: ReturnType<typeof shared>,
  routes: Routes,
): Feature[] {
  const { env, bridge, notifier, buttons } = wiring;
  const iconClasses = new TextButtonClasses();
  const { document } = env.window;
  const stories = new StoryDownloader({
    finder,
    downloader,
    notifier,
    files: wiring.files,
    errors: wiring.errors,
    kinds: [new UserStories(bridge), new HighlightStories(bridge)],
  });
  return [
    new ProfileToolbar({
      document,
      profiles: routes.profiles,
      buttons,
      iconClasses,
      profileButtons: profileButtons(wiring, parts, viewers, downloader),
    }),
    new StoryToolbar({
      document,
      stories: routes.stories,
      buttons,
      iconClasses,
      storyButtons: [
        new CurrentStoryButton(BUTTON_LOOKS.story, stories, assets, document),
        new AllStoriesButton(BUTTON_LOOKS.allStories, stories),
      ],
    }),
  ];
}

export function features(wiring: Wiring): Feature[] {
  const parts = shared(wiring);
  const pages = routes(() => wiring.env.window.location.pathname);
  return [
    ...postFeatures(wiring, parts, pages),
    ...accountFeatures(wiring, parts, pages),
  ];
}
