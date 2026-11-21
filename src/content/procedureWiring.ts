// Registers every procedure the content script can ask the page for, by the
// check its answer gets. A new procedure adds its entry here.
import type { ProcedureOutputs } from "../shared/bridge";
import { ACCOUNT_PROCEDURE } from "../shared/procedures/account";
import { FOLLOWING_PAGE_PROCEDURE } from "../shared/procedures/followingPage";
import { MEDIA_PROCEDURE } from "../shared/procedures/media";
import { MEDIA_BY_ASSET_PROCEDURE } from "../shared/procedures/mediaByAsset";
import { POSTS_PAGE_PROCEDURE } from "../shared/procedures/postsPage";
import { REEL_PROCEDURE } from "../shared/procedures/reel";
import { USER_REEL_PROCEDURE } from "../shared/procedures/userReel";
import { VIEWER_PROCEDURE } from "../shared/procedures/viewer";

// How each procedure's answer is checked. The compiler refuses this table
// until every procedure has its check.
export const PROCEDURE_OUTPUTS = {
  viewer: VIEWER_PROCEDURE,
  media: MEDIA_PROCEDURE,
  mediaByAsset: MEDIA_BY_ASSET_PROCEDURE,
  postsPage: POSTS_PAGE_PROCEDURE,
  account: ACCOUNT_PROCEDURE,
  followingPage: FOLLOWING_PAGE_PROCEDURE,
  reel: REEL_PROCEDURE,
  userReel: USER_REEL_PROCEDURE,
} as const satisfies ProcedureOutputs;
