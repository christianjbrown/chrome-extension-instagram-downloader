// The protocol between the content script and the script running inside the
// page. Only the page can reach Instagram's own modules and responses.
import type { InstagramMedia } from "./media";

export const pageOrigin = "https://www.instagram.com";

export interface Viewer {
  readonly id: string;
  readonly username: string;
}

export interface Account {
  readonly id: string;
  readonly username: string;
  readonly profilePicUrl: string | undefined;
  readonly totalPosts: number;
}

export interface PostsPage {
  readonly items: readonly InstagramMedia[];
  readonly cursor: string | undefined;
  /** Posts left out because they did not have the expected shape. */
  readonly unreadable?: number;
  /** How many posts the account has, when the page already knows. */
  readonly total?: number;
}

export interface FollowingPage {
  readonly usernames: readonly string[];
  readonly next: string | undefined;
}

export interface Reel {
  readonly owner: string | undefined;
  readonly items: readonly InstagramMedia[];
}

interface Procedures {
  viewer: { input: Record<string, never>; output: Viewer };
  media: { input: { mediaId: string }; output: InstagramMedia };
  mediaByAsset: { input: { asset: string }; output: InstagramMedia };
  postsPage: {
    input: { username: string; cursor: string | undefined };
    output: PostsPage;
  };
  account: { input: { username: string }; output: Account };
  followingPage: {
    input: { userId: string; next: string | undefined };
    output: FollowingPage;
  };
  reel: { input: { reelId: string }; output: Reel };
  userReel: { input: { username: string }; output: Reel };
}

export type ProcedureName = keyof Procedures;
export type Input<N extends ProcedureName> = Procedures[N]["input"];
export type Output<N extends ProcedureName> = Procedures[N]["output"];

export interface BridgeRequest {
  readonly igdlProcedure: ProcedureName;
  readonly input: unknown;
}

export type BridgeResponse =
  | { readonly ok: true; readonly value: unknown }
  | { readonly ok: false; readonly error: string; readonly refused?: true };

export function isBridgeRequest(data: unknown): data is BridgeRequest {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as { igdlProcedure?: unknown }).igdlProcedure === "string"
  );
}

export function isBridgeResponse(data: unknown): data is BridgeResponse {
  if (typeof data !== "object" || data === null) return false;
  const { ok, error, refused } = data as {
    ok?: unknown;
    error?: unknown;
    refused?: unknown;
  };
  return (
    ok === true ||
    (ok === false &&
      typeof error === "string" &&
      (refused === undefined || refused === true))
  );
}
