// Settings for the page script. Only its entry point reads them, and hands
// each one to the part that needs it.
import { USER_ID_PLACEHOLDER } from "./followingClient";
import type { InputLimits } from "./procedureInputs";

export interface PageConfig {
  // How many posts, accounts and stories are remembered before the oldest go.
  readonly cacheLimit: number;
  // How many posts to ask for in each page of an account's posts.
  readonly postsPageSize: number;
  // How many accounts to ask for in each page of who someone follows.
  readonly followingPageSize: number;
  // Instagram's endpoint for who someone follows, with USER_ID_PLACEHOLDER
  // where their id goes.
  readonly followingPath: string;
  readonly inputLimits: InputLimits;
}

export const PAGE_CONFIG: PageConfig = {
  cacheLimit: 2000,
  postsPageSize: 12,
  followingPageSize: 25,
  followingPath: `/api/v1/friendships/${USER_ID_PLACEHOLDER}/following/`,
  inputLimits: {
    text: 2048,
    mediaId: 64,
    username: 30,
    reelId: 128,
    asset: 512,
    userId: 32,
  },
};
