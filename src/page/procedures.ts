// What the content script can ask the page for. Answers come from the cache
// of what Instagram already sent whenever possible, and from a query if not.
import type { Account, PostsPage, Reel } from "../shared/bridge";
import type { Handlers } from "./bridgeServer";
import type {
  FollowingPages,
  Queries,
  ViewerIdSource,
  MediaLookup,
  ReelLookup,
  UserLookup,
} from "./ports";

interface Dependencies {
  readonly media: MediaLookup;
  readonly users: UserLookup;
  readonly reels: ReelLookup;
  readonly viewer: ViewerIdSource;
  readonly queries: Queries;
  readonly following: FollowingPages;
}

const text = {
  notFound: "Could not find",
  storyNotLoaded: "This story has not loaded yet",
  pictureNotLoaded: "That picture has not loaded yet",
} as const;

// Runs a lookup that may throw, as a promise that rejects instead.
const settle = <T>(lookup: () => T): Promise<T> =>
  Promise.resolve().then(lookup);

function found<T>(value: T | undefined, message: string): T {
  if (value === undefined) throw new Error(message);
  return value;
}

async function userId(
  { users, queries }: Dependencies,
  username: string,
): Promise<string> {
  const cached = users.userId(username);
  if (cached !== undefined) return cached;
  // Pinned collaborations can put someone else's post first.
  const { items } = await queries.postsPage(username, undefined);
  const own = items.find((item) => item.user?.username === username);
  return String(found(own?.user?.pk, `${text.notFound} ${username}`));
}

async function account(
  dependencies: Dependencies,
  username: string,
): Promise<Account> {
  const id = await userId(dependencies, username);
  const profile = await dependencies.queries.profile(id);
  return { id, ...profile };
}

// The total comes free from the profile Instagram already loaded, so it is
// only there when the account's page has been visited.
async function postsPage(
  { users, queries }: Dependencies,
  username: string,
  cursor: string | undefined,
): Promise<PostsPage> {
  const page = await queries.postsPage(username, cursor);
  const total = users.postCount(username);
  return total === undefined ? page : { ...page, total };
}

function reel(reels: ReelLookup, reelId: string | undefined): Reel {
  return found(
    reelId === undefined ? undefined : reels.reel(reelId),
    text.storyNotLoaded,
  );
}

export function createProcedures(dependencies: Dependencies): Handlers {
  const { viewer, media, users, reels, queries, following } = dependencies;
  return {
    viewer: async () => {
      const id = viewer.viewerId();
      const profile = await queries.profile(id);
      return { id, username: profile.username };
    },
    media: async ({ mediaId }) =>
      media.mediaById(mediaId) ?? queries.mediaById(mediaId),
    mediaByAsset: ({ asset }) =>
      settle(() => found(media.mediaByAsset(asset), text.pictureNotLoaded)),
    postsPage: ({ username, cursor }) =>
      postsPage(dependencies, username, cursor),
    account: ({ username }) => account(dependencies, username),
    followingPage: ({ userId: id, next }) => following.page(id, next),
    reel: ({ reelId }) => settle(() => reel(reels, reelId)),
    userReel: ({ username }) =>
      settle(() => reel(reels, users.userId(username))),
  };
}
