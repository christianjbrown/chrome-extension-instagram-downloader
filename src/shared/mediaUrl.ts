// Where Instagram serves pictures and videos from. A download only ever
// fetches an address the page script could not have pointed somewhere else.
const mediaHosts = [".cdninstagram.com", ".fbcdn.net"];

// Media is only ever fetched over an encrypted connection.
const SECURE_PROTOCOL = "https:";

export function isMediaUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return (
    url.protocol === SECURE_PROTOCOL &&
    mediaHosts.some((host) => url.hostname.endsWith(host))
  );
}
