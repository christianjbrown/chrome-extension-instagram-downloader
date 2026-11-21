// The parts of a bulk download, as the others see them.
import type { PostsPage, Viewer } from "../../shared/bridge";
import type { WaitReporter } from "../pacing/pacing";
import type {
  AccountProgress,
  DetailReporter,
  HeadingReporter,
  RunReporter,
} from "../ui/ports";
import type { Counts } from "./counts";
import type { RunState } from "./runState";

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

export interface RunProgress {
  /** Whether a run for this account was stopped part way. */
  inProgress(viewerId: string): Promise<boolean>;
}

/** Tells whether the signed-in account has a following run to carry on. */
export interface ResumableRun {
  canResume(viewer: Viewer): Promise<boolean>;
}
