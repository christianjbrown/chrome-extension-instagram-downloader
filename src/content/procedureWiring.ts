// Registers every procedure the content script can ask the page for, by the
// check its answer gets. A new procedure adds its entry here.
import type { ProcedureOutputs } from "../shared/bridge";
import type { MediaChecks } from "../shared/checks";
import { AccountOutput } from "../shared/procedures/account";
import { FollowingPageOutput } from "../shared/procedures/followingPage";
import { MediaOutput } from "../shared/procedures/media";
import { MediaByAssetOutput } from "../shared/procedures/mediaByAsset";
import { PostsPageOutput } from "../shared/procedures/postsPage";
import { ReelOutput } from "../shared/procedures/reel";
import { UserReelOutput } from "../shared/procedures/userReel";
import { ViewerOutput } from "../shared/procedures/viewer";

// How each procedure's answer is checked. The compiler refuses this table
// until every procedure has its check.
export function procedureOutputs(checks: MediaChecks): ProcedureOutputs {
  return {
    viewer: new ViewerOutput(),
    media: new MediaOutput(checks),
    mediaByAsset: new MediaByAssetOutput(checks),
    postsPage: new PostsPageOutput(checks),
    account: new AccountOutput(checks),
    followingPage: new FollowingPageOutput(),
    reel: new ReelOutput(checks),
    userReel: new UserReelOutput(checks),
  };
}
