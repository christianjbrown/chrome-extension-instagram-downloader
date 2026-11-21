// The handful of Instagram queries this extension needs, each returning only
// the part of the response it uses.
import type { PostsPage } from "../shared/bridge";
import type { InstagramMedia } from "../shared/media";
import { isJsonObject, type JsonObject } from "../shared/json";
import { isMediaRecord } from "./mediaShapes";
import type { Relay, ProfileUser, Queries } from "./ports";
import { MODULES, POST_BY_ID_MEMBER, RESPONSE_KEYS } from "./instagramApi";

const text = {
  unexpected: "Unexpected response",
  postNotFound: "Post not found",
  accountNotFound: "Account not found",
} as const;

// An account that does not say how many posts it has is counted as empty.
const noPosts = 0;

const noneLeftOut = 0;

function field(value: unknown, key: string): unknown {
  if (!isJsonObject(value)) throw new Error(`${text.unexpected} at ${key}`);
  return value[key];
}

function asArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error(text.unexpected);
  return value as unknown[];
}

const postsVariables = (
  username: string,
  cursor: string | undefined,
  pageSize: number,
) => ({
  after: cursor ?? null,
  first: pageSize,
  data: {
    count: pageSize,
    include_reel_media_seen_timestamp: true,
    include_relationship_info: true,
    latest_besties_reel_media: true,
    latest_reel_media: true,
  },
  username,
  __relay_internal__pv__PolarisImmersiveFeedrelayprovider: false,
});

// Posts without even an id are left out and counted, so the run counts them
// as failed rather than losing them.
const unreadable = (count: number): { unreadable?: number } =>
  count === noneLeftOut ? {} : { unreadable: count };

function profilePicture(user: JsonObject): string | undefined {
  const hd = user.hd_profile_pic_url_info;
  const url = isJsonObject(hd) ? hd.url : user.profile_pic_url;
  return typeof url === "string" ? url : undefined;
}

export class InstagramQueries implements Queries {
  constructor(
    private readonly relay: Relay,
    private readonly postsPageSize: number,
  ) {}

  async mediaById(mediaId: string): Promise<InstagramMedia> {
    const query = this.relay.query(MODULES.postQuery, POST_BY_ID_MEMBER);
    const data = await this.relay.run(query, { mediaId });
    const info = field(data, RESPONSE_KEYS.mediaInfo);
    const [media] = asArray(field(info, RESPONSE_KEYS.items));
    if (!isMediaRecord(media)) throw new Error(text.postNotFound);
    return media;
  }

  async postsPage(
    username: string,
    cursor: string | undefined,
  ): Promise<PostsPage> {
    const query = this.relay.query(MODULES.profilePostsQuery);
    const data = await this.relay.run(
      query,
      postsVariables(username, cursor, this.postsPageSize),
    );
    const connection = field(data, RESPONSE_KEYS.timeline);
    const nodes = asArray(field(connection, RESPONSE_KEYS.edges)).map((edge) =>
      field(edge, RESPONSE_KEYS.node),
    );
    const items = nodes.filter(isMediaRecord);
    const pageInfo = field(connection, RESPONSE_KEYS.pageInfo);
    const more = field(pageInfo, RESPONSE_KEYS.hasNextPage) === true;
    const end = field(pageInfo, RESPONSE_KEYS.endCursor);
    return {
      items,
      cursor: more && typeof end === "string" ? end : undefined,
      ...unreadable(nodes.length - items.length),
    };
  }

  async profile(userId: string): Promise<ProfileUser> {
    const query = this.relay.query(MODULES.profilePageQuery);
    const data = await this.relay.run(query, {
      id: userId,
      enable_integrity_filters: true,
    });
    const user = field(data, RESPONSE_KEYS.user);
    if (!isJsonObject(user) || typeof user.username !== "string")
      throw new Error(text.accountNotFound);
    return {
      username: user.username,
      profilePicUrl: profilePicture(user),
      totalPosts:
        typeof user.media_count === "number" ? user.media_count : noPosts,
    };
  }
}
