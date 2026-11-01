// What the content script can ask the page for. Answers come from the cache
// of what Instagram already sent whenever possible, and from a query if not.
import type { Account, PostsPage, Reel } from "../shared/bridge";
import type { Handlers } from "./bridgeServer";
import type { FollowingClient } from "./followingClient";
import type { InstagramQueries } from "./instagramQueries";
import type { MediaCache } from "./mediaCache";

interface Dependencies {
  readonly cache: MediaCache;
  readonly queries: InstagramQueries;
  readonly following: FollowingClient;
}

// Runs a lookup that may throw, as a promise that rejects instead.
const settle = <T>(lookup: () => T): Promise<T> =>
  Promise.resolve().then(lookup);

function found<T>(value: T | undefined, message: string): T {
  if (value === undefined) throw new Error(message);
  return value;
}

async function userId(
  { cache, queries }: Dependencies,
  username: string,
): Promise<string> {
  const cached = cache.userId(username);
  if (cached !== undefined) return cached;
  // Pinned collaborations can put someone else's post first.
  const { items } = await queries.postsPage(username, undefined);
  const own = items.find((item) => item.user?.username === username);
  return String(found(own?.user?.pk, `Could not find ${username}`));
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
  { cache, queries }: Dependencies,
  username: string,
  cursor: string | undefined,
): Promise<PostsPage> {
  const page = await queries.postsPage(username, cursor);
  const total = cache.postCount(username);
  return total === undefined ? page : { ...page, total };
}

function reel(cache: MediaCache, reelId: string | undefined): Reel {
  return found(
    reelId === undefined ? undefined : cache.reel(reelId),
    "This story has not loaded yet",
  );
}

export function createProcedures(dependencies: Dependencies): Handlers {
  const { cache, queries, following } = dependencies;
  return {
    viewer: async () => {
      const id = queries.viewerId();
      const profile = await queries.profile(id);
      return { id, username: profile.username };
    },
    media: async ({ mediaId }) =>
      cache.mediaById(mediaId) ?? queries.mediaById(mediaId),
    mediaByAsset: ({ asset }) =>
      settle(() =>
        found(cache.mediaByAsset(asset), "That picture has not loaded yet"),
      ),
    postsPage: ({ username, cursor }) =>
      postsPage(dependencies, username, cursor),
    account: ({ username }) => account(dependencies, username),
    followingPage: ({ userId: id, next }) => following.page(id, next),
    reel: ({ reelId }) => settle(() => reel(cache, reelId)),
    userReel: ({ username }) =>
      settle(() => reel(cache, cache.userId(username))),
  };
}
