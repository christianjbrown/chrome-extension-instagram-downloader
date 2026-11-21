// Registers every procedure the page answers, each built from what it needs.
// A new procedure adds its entry here.
import {
  OptionalTextField,
  PatternField,
  type InputLimits,
} from "./inputFields";
import type {
  FollowingPages,
  MediaLookup,
  MediaQuery,
  PostsQuery,
  ProcedureTable,
  ProfileQuery,
  ReelLookup,
  UserLookup,
  ViewerIdSource,
} from "./ports";
import { AccountProcedure } from "./procedures/account";
import { FollowingPageProcedure } from "./procedures/followingPage";
import { MediaProcedure } from "./procedures/media";
import { MediaByAssetProcedure } from "./procedures/mediaByAsset";
import { PostsPageProcedure } from "./procedures/postsPage";
import { ReelProcedure } from "./procedures/reel";
import { UserReelProcedure } from "./procedures/userReel";
import { ViewerProcedure } from "./procedures/viewer";

/** What the procedures answer from. */
export interface ProcedureSources {
  readonly media: MediaLookup;
  readonly users: UserLookup;
  readonly reels: ReelLookup;
  readonly viewer: ViewerIdSource;
  readonly mediaQuery: MediaQuery;
  readonly postsQuery: PostsQuery;
  readonly profileQuery: ProfileQuery;
  readonly following: FollowingPages;
}

// The characters each kind of identifier is made of, as a regular
// expression character class.
const FIELD_CHARACTERS = {
  mediaId: "0-9_",
  username: "A-Za-z0-9._",
  reelId: "\\w:.-",
  asset: "^/\\\\?#",
  userId: "\\d",
} as const;

function fields(limits: InputLimits) {
  const pattern = (name: keyof typeof FIELD_CHARACTERS) =>
    new PatternField(FIELD_CHARACTERS[name], limits[name]);
  return {
    text: new OptionalTextField(limits.text),
    mediaId: pattern("mediaId"),
    username: pattern("username"),
    reelId: pattern("reelId"),
    asset: pattern("asset"),
    userId: pattern("userId"),
  };
}

// The compiler refuses this table until every procedure has its entry.
export function procedureTable(
  sources: ProcedureSources,
  limits: InputLimits,
): ProcedureTable {
  const { media, users, reels, viewer, following } = sources;
  const { mediaQuery, postsQuery, profileQuery } = sources;
  const field = fields(limits);
  return {
    viewer: new ViewerProcedure(viewer, profileQuery),
    media: new MediaProcedure(media, mediaQuery, field.mediaId),
    mediaByAsset: new MediaByAssetProcedure(media, field.asset),
    postsPage: new PostsPageProcedure(
      users,
      postsQuery,
      field.username,
      field.text,
    ),
    account: new AccountProcedure(
      users,
      postsQuery,
      profileQuery,
      field.username,
    ),
    followingPage: new FollowingPageProcedure(
      following,
      field.userId,
      field.text,
    ),
    reel: new ReelProcedure(reels, field.reelId),
    userReel: new UserReelProcedure(reels, users, field.username),
  };
}
