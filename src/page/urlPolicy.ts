import { parseUrl } from "../shared/url";
import type { UrlPolicy } from "./ports";

const watchedPath = /^\/(?:graphql|api)\//;

// Instagram's own GraphQL and API calls, and nothing on any other site.
export class InstagramApiPolicy implements UrlPolicy {
  constructor(private readonly origin: string) {}

  isWatched(url: string): boolean {
    const resolved = parseUrl(url, this.origin);
    return resolved !== undefined && this.isApi(resolved);
  }

  private isApi(resolved: URL): boolean {
    return (
      resolved.origin === this.origin && watchedPath.test(resolved.pathname)
    );
  }
}
