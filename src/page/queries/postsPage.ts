// Pages through an account's posts with Instagram's own profile query.
import { optionalField, someCount } from "../../shared/fields";
import { textOrUndefined } from "../../shared/json";
import { MODULES, RESPONSE_KEYS } from "../instagramApi";
import { isMediaRecord } from "../mediaShapes";
import type { PagePostsPage, PostsQuery, Relay } from "../ports";
import { asArray, field } from "../responseFields";

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

// The cursor of the page after this one, when there is one.
function nextCursor(pageInfo: unknown): string | undefined {
  const more = field(pageInfo, RESPONSE_KEYS.hasNextPage) === true;
  return more
    ? textOrUndefined(field(pageInfo, RESPONSE_KEYS.endCursor))
    : undefined;
}

export class PostsPageQuery implements PostsQuery {
  constructor(
    private readonly relay: Relay,
    private readonly pageSize: number,
  ) {}

  async postsPage(
    username: string,
    cursor: string | undefined,
  ): Promise<PagePostsPage> {
    const query = this.relay.query(MODULES.profilePostsQuery);
    const data = await this.relay.run(
      query,
      postsVariables(username, cursor, this.pageSize),
    );
    const connection = field(data, RESPONSE_KEYS.timeline);
    const nodes = asArray(field(connection, RESPONSE_KEYS.edges)).map((edge) =>
      field(edge, RESPONSE_KEYS.node),
    );
    const items = nodes.filter(isMediaRecord);
    return {
      items,
      cursor: nextCursor(field(connection, RESPONSE_KEYS.pageInfo)),
      // Posts without even an id are left out and counted, so the run
      // counts them as failed rather than losing them.
      ...optionalField("unreadable", someCount(nodes.length - items.length)),
    };
  }
}
