// The protocol between the content script and the script running inside the
// page. Only the page can reach Instagram's own modules and responses.
import { isJsonObject, type JsonObject } from "./json";
import type { InstagramMedia } from "./media";

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

// Every procedure the content script can ask the page for, by name, with what
// it takes and what it answers. Each procedure's own module under
// shared/procedures adds its entry, so a new one changes nothing here. It is
// exported for those modules to extend, which knip does not count as a use.
/** @public */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Procedures {}

export type ProcedureName = keyof Procedures;
export type Input<N extends ProcedureName> = Procedures[N]["input"];
export type Output<N extends ProcedureName> = Procedures[N]["output"];

/** How the content script checks one procedure's answer before using it. */
export interface ProcedureOutput<N extends ProcedureName> {
  readonly name: N;
  parse(value: unknown): Output<N>;
}

/** Every procedure's answer check, by procedure name. */
export type ProcedureOutputs = {
  readonly [N in ProcedureName]: ProcedureOutput<N>;
};

/**
 * A request as the page receives it. The name is only known to be text: the
 * page checks it against the procedures it was given before trusting it.
 */
export interface BridgeRequest {
  readonly igdlProcedure: string;
  readonly input: unknown;
}

export type BridgeResponse =
  | { readonly ok: true; readonly value: unknown }
  | { readonly ok: false; readonly error: string; readonly refused?: true };

export function isBridgeRequest(data: unknown): data is BridgeRequest {
  return isJsonObject(data) && typeof data.igdlProcedure === "string";
}

// A refusal is only ever marked true, or not marked at all.
const isRefusalMark = (refused: unknown): boolean =>
  refused === undefined || refused === true;

const isFailureDetail = ({ error, refused }: JsonObject): boolean =>
  typeof error === "string" && isRefusalMark(refused);

const isFailure = (data: JsonObject): boolean =>
  data.ok === false && isFailureDetail(data);

const isAnswer = (data: JsonObject): boolean =>
  data.ok === true || isFailure(data);

export function isBridgeResponse(data: unknown): data is BridgeResponse {
  return isJsonObject(data) && isAnswer(data);
}
