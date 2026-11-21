// The parts of a bulk download, as the others see them.
import type { PostsPage, Viewer } from "../../shared/bridge";
import type { DownloadItem } from "../../shared/media";
import type { WaitReporter } from "../pacing/pacing";
import type {
  AccountProgress,
  DetailReporter,
  HeadingReporter,
  OverallProgress,
  RunReporter,
} from "../ui/ports";
import type { WriteOutcome } from "../saving/ports";
import type { Counts } from "./counts";
import type { RunState } from "./runState";

/** How an account's files are worded once it is done. */
export interface CountsWording {
  counts(counts: Counts): string;
}

/** How the posts and files of the account being saved are worded. */
export interface ProgressWording {
  progress(post: number, total: number | undefined, counts: Counts): string;
}

/** How the accounts a run could not read are worded. */
export interface FailureWording {
  failureStop(inARow: number, username: string, reason: string): string;
  /** Nothing when every account was read. */
  unreadable(usernames: readonly string[]): string;
}

/** How a run over the accounts the viewer follows is worded. */
export interface FollowingWording {
  account(position: number, total: number): string;
  accountsFinished(total: number): string;
  followingFinished(total: number): string;
}

export interface ArchiveRequest {
  readonly username: string;
  readonly folder: FileSystemDirectoryHandle;
  /** The account was archived in full before, so stop at posts already saved. */
  readonly onlyNew: boolean;
  readonly signal: AbortSignal;
  readonly reporter: DetailReporter & WaitReporter & AccountProgress;
}

export interface Archiver {
  archive(request: ArchiveRequest): Promise<Counts>;
}

/** Takes in each page of posts as an account's pages are gone through. */
export interface PageVisitor {
  /** The account's total, once it has been looked up. */
  total(total: number | undefined): void;
  /** Writes one page of posts and says how many new files it saved. */
  page(result: PostsPage): Promise<number>;
}

/** Goes through an account's pages of posts, stopping early once a rerun has caught up. */
export interface AccountPages {
  walk(request: ArchiveRequest, visitor: PageVisitor): Promise<void>;
}

/** Saves one file unless it is already there, keeping to the pace between files. */
export interface ItemSaver {
  save(
    folder: FileSystemDirectoryHandle,
    item: DownloadItem,
    signal: AbortSignal,
  ): Promise<WriteOutcome>;
}

/** Where an account has got to: the post, its total when known, and its files. */
export interface AccountPosition {
  readonly post: number;
  readonly total: number | undefined;
  readonly counts: Counts;
}

/** Counts one account's posts and files. */
export interface AccountCounter {
  total(total: number | undefined): void;
  /** Posts the page could not read, counted as failed. */
  unreadable(count: number | undefined): void;
  nextPost(): void;
  file(outcome: WriteOutcome): void;
  saved(): number;
  tally(): Counts;
  position(): AccountPosition;
  /** How far through the account, or undefined while its total is unknown. */
  fraction(): number | undefined;
  /** What a finished account's bar shows, or undefined to leave it be. */
  finishedFraction(): number | undefined;
}

/** One account's counts, and how far through it the panel shows. */
export interface AccountTally {
  /** Hides the bar until the account's total is known. */
  begin(): void;
  total(total: number | undefined): void;
  /** Posts the page could not read, counted as failed. */
  unreadable(count: number | undefined): void;
  nextPost(): void;
  /** One file was saved, skipped or failed. */
  file(outcome: WriteOutcome): void;
  /** How many new files have been saved so far. */
  saved(): number;
  /** Fills the bar when the account's total was known, and gives the counts. */
  finish(): Counts;
}

/** Starts the tally for one account, reporting to that run's panel. */
export interface TallyStarter {
  start(reporter: DetailReporter & AccountProgress): AccountTally;
}

export interface BulkJob {
  readonly title: string;
  run(
    folder: FileSystemDirectoryHandle,
    signal: AbortSignal,
    reporter: RunReporter,
  ): Promise<string>;
}

export interface JobRunner {
  run(job: BulkJob): Promise<void>;
}

export interface CatchUpPolicy {
  /** Whether to look up the account's total before writing this page. */
  wantsTotal(page: number, onlyNew: boolean): boolean;
  /** Whether the run has reached posts saved before, after writing this page. */
  caughtUp(page: number, onlyNew: boolean, newFiles: number): boolean;
}

/** Tells the errors that end a whole run from those a run can carry on past. */
export interface RunStopPolicy {
  endsTheRun(error: unknown): boolean;
}

export interface FailureTally {
  /** Forgets the last run, ready for a new one. */
  reset(): void;
  /** The account finished, so a run of failures is broken. */
  succeeded(): void;
  /** Notes a failed account, or rethrows when the run should stop instead. */
  failed(username: string, error: unknown): void;
  /** The accounts that could not be read, or nothing when every one could. */
  summary(): string;
}

export interface FollowingRequest {
  readonly viewer: Viewer;
  readonly folder: FileSystemDirectoryHandle;
  readonly signal: AbortSignal;
  readonly reporter: RunReporter;
}

/** Shows where a following run has got to, and words how it ended. */
export interface FollowingProgress {
  /** The account starting now, counting those already done before it. */
  account(
    reporter: OverallProgress & HeadingReporter,
    done: number,
    total: number,
    username: string,
  ): void;
  finished(reporter: OverallProgress, total: number): void;
  /** The sentence that ends the run, followed by the accounts it could not read. */
  summary(total: number, unreadable: string): string;
}

export interface FollowingRunner {
  run(request: FollowingRequest): Promise<string>;
}

export interface ListRequest {
  readonly viewer: Viewer;
  readonly signal: AbortSignal;
  readonly reporter: HeadingReporter & DetailReporter & WaitReporter;
}

export interface FollowingSource {
  list(request: ListRequest): Promise<string[]>;
}

export interface PostTotals {
  /** How many posts the account has, or undefined when that cannot be found. */
  find(
    username: string,
    firstPage: PostsPage,
    signal: AbortSignal,
    reporter: WaitReporter,
  ): Promise<number | undefined>;
}

export interface RunStateStore {
  load(viewerId: string): Promise<RunState>;
  save(viewerId: string, state: RunState): Promise<void>;
}

/** The steps a following run takes its stored state through. */
export interface ResumePolicy {
  /** A run over who the viewer follows now, keeping the progress made on them. */
  begin(state: RunState, following: string[]): RunState;
  /** The accounts the run still has to archive, in order. */
  remaining(state: RunState, following: string[]): string[];
  /** Whether the account was archived in full by an earlier run. */
  archivedBefore(state: RunState, username: string): boolean;
  /** The account has just been archived in full, at this time. */
  accountDone(state: RunState, username: string, at: number): RunState;
  /** The run is over, but which accounts were archived in full is kept. */
  finished(state: RunState): RunState;
}

export interface RunProgress {
  /** Whether a run for this account was stopped part way. */
  inProgress(viewerId: string): Promise<boolean>;
}

/** Tells whether the signed-in account has a following run to carry on. */
export interface ResumableRun {
  canResume(viewer: Viewer): Promise<boolean>;
}
