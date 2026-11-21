// The handful of Instagram queries this extension needs, each returning only
// the part of the response it uses.
import type { PostsPage } from "../shared/bridge";
import type { InstagramMedia } from "../shared/media";
import {
  isJsonObject,
  type JsonObject,
  type ModuleRequire,
  type RelayClient,
} from "./relayClient";
import { MODULES, POST_BY_ID_MEMBER, RESPONSE_KEYS } from "./instagramApi";

export interface ProfileUser {
  readonly username: string;
  readonly profilePicUrl: string | undefined;
  readonly totalPosts: number;
}

const text = {
  unexpected: "Unexpected response",
  postNotFound: "Post not found",
  accountNotFound: "Account not found",
} as const;

// An account that does not say how many posts it has is counted as empty.
const noPosts = 0;

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

function profilePicture(user: JsonObject): string | undefined {
  const hd = user.hd_profile_pic_url_info;
  const url = isJsonObject(hd) ? hd.url : user.profile_pic_url;
  return typeof url === "string" ? url : undefined;
}

export class InstagramQueries {
  constructor(
    private readonly relay: RelayClient,
    private readonly require: ModuleRequire,
    private readonly postsPageSize: number,
  ) {}

  viewerId(): string {
    const config = this.require(MODULES.config) as {
      getViewerId(): string | number;
    };
    return String(config.getViewerId());
  }

  async mediaById(mediaId: string): Promise<InstagramMedia> {
    const query = this.relay.query(MODULES.postQuery, POST_BY_ID_MEMBER);
    const data = await this.relay.run(query, { mediaId });
    const info = field(data, RESPONSE_KEYS.mediaInfo);
    const [media] = asArray(field(info, RESPONSE_KEYS.items));
    if (!isJsonObject(media)) throw new Error(text.postNotFound);
    return media as unknown as InstagramMedia;
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
    const items = asArray(field(connection, RESPONSE_KEYS.edges)).map((edge) =>
      field(edge, RESPONSE_KEYS.node),
    ) as InstagramMedia[];
    const pageInfo = field(connection, RESPONSE_KEYS.pageInfo);
    const more = field(pageInfo, RESPONSE_KEYS.hasNextPage) === true;
    const end = field(pageInfo, RESPONSE_KEYS.endCursor);
    return {
      items,
      cursor: more && typeof end === "string" ? end : undefined,
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
