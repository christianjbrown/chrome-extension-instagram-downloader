export type FetchBlob = (url: string) => Promise<Blob>;

export function blobFetcher(
  fetchFn: (url: string) => Promise<Response>,
): FetchBlob {
  return async (url) => {
    const response = await fetchFn(url);
    if (!response.ok)
      throw new Error(`Download failed (${String(response.status)})`);
    return response.blob();
  };
}
