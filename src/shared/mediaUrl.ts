import { parseUrl } from "./url";

// Where Instagram serves pictures and videos from. A download only ever
// fetches an address the page script could not have pointed somewhere else.
const mediaHosts = [".cdninstagram.com", ".fbcdn.net"];

// Media is only ever fetched over an encrypted connection.
const SECURE_PROTOCOL = "https:";

const isSecureMediaHost = (url: URL): boolean =>
  url.protocol === SECURE_PROTOCOL &&
  mediaHosts.some((host) => url.hostname.endsWith(host));

export function isMediaUrl(value: string): boolean {
  const url = parseUrl(value);
  return url !== undefined && isSecureMediaHost(url);
}
