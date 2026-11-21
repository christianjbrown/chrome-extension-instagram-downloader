// What the parts of the page script depend on, apart from how any of them is
// built. Each concrete class implements one or more of these.
import type {
  FollowingPage,
  Input,
  Output,
  PostsPage,
  ProcedureName,
  Reel,
} from "../shared/bridge";
import type { JsonObject } from "../shared/json";
import type { InstagramMedia } from "../shared/media";

/** Somewhere to remember values by key. */
export interface KeyedStore<V> {
  get(key: string): V | undefined;
  set(key: string, value: V): void;
}

/** A store whose values can also be gone through, for lookups by anything else. */
export interface IterableStore<V> extends KeyedStore<V> {
  values(): Iterable<V>;
}

/** Takes in whatever Instagram sent the page. */
export interface MediaSink {
  ingest(root: unknown): void;
}

/** Remembers one kind of object Instagram sends, and ignores every other. */
export interface Rememberer {
  remember(value: JsonObject): void;
}

/** The posts, stories and slides remembered so far, by id. */
export interface MediaByIdLookup {
  mediaById(pk: string): InstagramMedia | undefined;
}

/** The posts, stories and slides remembered so far, by picture. */
export interface MediaByAssetLookup {
  /** The media, or the carousel slide, a picture on screen belongs to. */
  mediaByAsset(asset: string): InstagramMedia | undefined;
}

export interface MediaLookup extends MediaByIdLookup, MediaByAssetLookup {}

/** The ids of the accounts remembered so far. */
export interface UserIdLookup {
  userId(username: string): string | undefined;
}

/** How many posts the accounts remembered so far have. */
export interface PostCountLookup {
  postCount(username: string): number | undefined;
}

export interface UserLookup extends UserIdLookup, PostCountLookup {}

/** The story reels remembered so far. */
export interface ReelLookup {
  reel(reelId: string): Reel | undefined;
}

/** Which of the page's requests are worth reading. */
export interface UrlPolicy {
  isWatched(url: string): boolean;
}

export interface FollowingPages {
  page(userId: string, next: string | undefined): Promise<FollowingPage>;
}

export interface HeaderSource {
  headers(): Record<string, string>;
}

export interface ProfileUser {
  readonly username: string;
  readonly profilePicUrl: string | undefined;
  readonly totalPosts: number;
}

export interface MediaQuery {
  mediaById(mediaId: string): Promise<InstagramMedia>;
}

export interface PostsQuery {
  postsPage(username: string, cursor: string | undefined): Promise<PostsPage>;
}

export interface ProfileQuery {
  profile(userId: string): Promise<ProfileUser>;
}

export interface Queries extends MediaQuery, PostsQuery, ProfileQuery {}

/** Whether one field of a request has the only shape it may have. */
export interface FieldCheck {
  accepts(value: unknown): boolean;
}

/** One thing the content script can ask the page for, answered here. */
export interface PageProcedure<N extends ProcedureName> {
  readonly name: N;
  /** Whether a request has the only shape this procedure accepts. */
  isInput(input: unknown): input is Input<N>;
  handle(input: Input<N>): Promise<Output<N>>;
}

/** Every procedure the page answers, by name. */
export type ProcedureTable = {
  readonly [N in ProcedureName]: PageProcedure<N>;
};

export interface RefusalDetector {
  isRefusal(error: unknown): boolean;
}

export type ModuleRequire = (name: string) => unknown;

export interface RelayQuery {
  readonly params: unknown;
}

export interface Relay {
  /** Loads a query from Instagram's modules, or one member of the module. */
  query(moduleName: string, member?: string): RelayQuery;
  run(query: RelayQuery, variables: JsonObject): Promise<JsonObject>;
}

export interface ViewerIdSource {
  viewerId(): string;
}

/** Turns an answer down, by throwing, unless it is one worth reading. */
export interface ResponsePolicy {
  accept(status: number, body: unknown): JsonObject;
}

/** Reads one page of who someone follows. */
export interface FollowingParser {
  parse(body: JsonObject): FollowingPage;
}
