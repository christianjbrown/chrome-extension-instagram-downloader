import type { MediaUrlPolicy } from "../../shared/checks";
import type { FetchBlob } from "./ports";
const text = {
  refused: "Refusing to download that address",
  failed: "Download failed",
} as const;

// Fetches only addresses the policy allows, so a download can never be
// pointed at another site.
export function blobFetcher(
  fetchFn: (url: string) => Promise<Response>,
  isAllowed: MediaUrlPolicy,
): FetchBlob {
  return async (url) => {
    if (!isAllowed(url)) throw new Error(text.refused);
    return blobOf(await fetchFn(url));
  };
}

function blobOf(response: Response): Promise<Blob> {
  if (!response.ok)
    throw new Error(`${text.failed} (${String(response.status)})`);
  return response.blob();
}
