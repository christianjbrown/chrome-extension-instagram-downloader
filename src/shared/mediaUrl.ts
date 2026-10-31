// Where Instagram serves pictures and videos from. A download only ever
// fetches an address the page script could not have pointed somewhere else.
const mediaHosts = [".cdninstagram.com", ".fbcdn.net"];

export function isMediaUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return (
    url.protocol === "https:" &&
    mediaHosts.some((host) => url.hostname.endsWith(host))
  );
}
