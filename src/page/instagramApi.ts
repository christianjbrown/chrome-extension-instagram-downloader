// Names Instagram's own code and responses use. They are Instagram's, not
// ours, so they live here once rather than scattered through the queries.

/** Modules the page script loads through Instagram's own require. */
export const MODULES = {
  config: "PolarisConfig",
  claim: "PolarisWWWClaim",
  relayEnvironment: "PolarisRelayEnvironment",
  postQuery: "PolarisPostActionLoadPostQuery",
  profilePostsQuery: "PolarisProfilePostsQuery",
  profilePageQuery: "PolarisProfilePageContentQuery",
} as const;

/** The member of the post query module that looks a post up by id. */
export const POST_BY_ID_MEMBER = "POST_QUERY_MEDIA_ID";

/** Where each query's answer sits in the JSON it sends back. */
export const RESPONSE_KEYS = {
  mediaInfo: "xdt_api__v1__media__media_id_web_info",
  timeline: "xdt_api__v1__feed__user_timeline_graphql_connection",
  items: "items",
  edges: "edges",
  node: "node",
  pageInfo: "page_info",
  hasNextPage: "has_next_page",
  endCursor: "end_cursor",
  user: "user",
} as const;

/** Headers Instagram's REST API wants on every call. */
export const HEADERS = {
  appId: "x-ig-app-id",
  claim: "x-ig-www-claim",
} as const;

/** What a REST answer says in its status field when it turned a call down. */
export const FAILED_STATUS = "fail";
