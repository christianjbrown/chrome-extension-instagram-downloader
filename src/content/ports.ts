// What the parts of the content script depend on across folders, apart from
// how any of them is built.
import type { Input, Output, ProcedureName } from "../shared/bridge";
import type { DownloadItem, InstagramMedia } from "../shared/media";

/** Carries a request to the page script and brings back its unchecked answer. */
export interface PageTransport {
  call(name: ProcedureName, input: unknown): Promise<unknown>;
}

/** Asks the page script for something, and answers only once it is checked. */
export interface Bridge {
  call<N extends ProcedureName>(name: N, input: Input<N>): Promise<Output<N>>;
}

// Runs something later. The returned function cancels it.
export interface Scheduler {
  after(ms: number, callback: () => void): () => void;
}

/** The files a post or story is saved as. */
export interface MediaFiles {
  /** `owner` names the files when the media itself does not say whose it is. */
  items(media: InstagramMedia, owner?: string): DownloadItem[];
}

/** Turns any error into the words shown to the user. */
export interface ErrorDescriber {
  describe(error: unknown): string;
}

/** The words for one kind of error, for the errors it recognises. */
export interface ErrorWording {
  matches(error: unknown): boolean;
  text(error: unknown): string;
}

/** Something done once as the content script starts. */
export interface StartupStep {
  run(): void;
}

/** Runs the features over the page now and whenever it changes. */
export interface PageWatcher {
  start(
    root: Node,
    createObserver: (callback: () => void) => MutationObserver,
  ): void;
}

/** Picks the address a media is saved from. */
export interface VersionChooser {
  url(media: InstagramMedia): string | undefined;
}
