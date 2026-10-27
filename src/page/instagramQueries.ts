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

export interface ProfileUser {
  readonly username: string;
  readonly profilePicUrl: string | undefined;
  readonly totalPosts: number;
}

function field(value: unknown, key: string): unknown {
  if (!isJsonObject(value)) throw new Error(`Unexpected response at ${key}`);
  return value[key];
}

function asArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error("Unexpected response");
  return value as unknown[];
}

const postsVariables = (username: string, cursor: string | undefined) => ({
  after: cursor ?? null,
  first: 12,
  data: {
    count: 12,
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
  ) {}

  viewerId(): string {
    const config = this.require("PolarisConfig") as {
      getViewerId(): string | number;
    };
    return String(config.getViewerId());
  }

  async mediaById(mediaId: string): Promise<InstagramMedia> {
    const query = this.relay.query(
      "PolarisPostActionLoadPostQuery",
      "POST_QUERY_MEDIA_ID",
    );
    const data = await this.relay.run(query, { mediaId });
    const info = field(data, "xdt_api__v1__media__media_id_web_info");
    const [media] = asArray(field(info, "items"));
    if (!isJsonObject(media)) throw new Error("Post not found");
    return media as unknown as InstagramMedia;
  }

  async postsPage(
    username: string,
    cursor: string | undefined,
  ): Promise<PostsPage> {
    const query = this.relay.query("PolarisProfilePostsQuery");
    const data = await this.relay.run(query, postsVariables(username, cursor));
    const connection = field(
      data,
      "xdt_api__v1__feed__user_timeline_graphql_connection",
    );
    const items = asArray(field(connection, "edges")).map((edge) =>
      field(edge, "node"),
    ) as InstagramMedia[];
    const pageInfo = field(connection, "page_info");
    const more = field(pageInfo, "has_next_page") === true;
    const end = field(pageInfo, "end_cursor");
    return {
      items,
      cursor: more && typeof end === "string" ? end : undefined,
    };
  }

  async profile(userId: string): Promise<ProfileUser> {
    const query = this.relay.query("PolarisProfilePageContentQuery");
    const data = await this.relay.run(query, {
      id: userId,
      enable_integrity_filters: true,
    });
    const user = field(data, "user");
    if (!isJsonObject(user) || typeof user.username !== "string")
      throw new Error("Account not found");
    return {
      username: user.username,
      profilePicUrl: profilePicture(user),
      totalPosts: typeof user.media_count === "number" ? user.media_count : 0,
    };
  }
}
