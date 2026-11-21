// What the parts of the content script depend on across folders, apart from
// how any of them is built.
import type { Input, Output, ProcedureName } from "../shared/bridge";
import type { DownloadItem, InstagramMedia } from "../shared/media";

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
