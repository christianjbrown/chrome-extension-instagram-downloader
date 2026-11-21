import type { FetchBlob } from "./ports";
const text = {
  refused: "Refusing to download that address",
  failed: "Download failed",
} as const;

// Fetches only addresses the policy allows, so a download can never be
// pointed at another site.
export function blobFetcher(
  fetchFn: (url: string) => Promise<Response>,
  isAllowed: (url: string) => boolean,
): FetchBlob {
  return async (url) => {
    if (!isAllowed(url)) throw new Error(text.refused);
    const response = await fetchFn(url);
    if (!response.ok)
      throw new Error(`${text.failed} (${String(response.status)})`);
    return response.blob();
  };
}
