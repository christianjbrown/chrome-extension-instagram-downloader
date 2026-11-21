import type { UrlPolicy } from "./ports";

const watchedPath = /^\/(?:graphql|api)\//;

// Instagram's own GraphQL and API calls, and nothing on any other site.
export class InstagramApiPolicy implements UrlPolicy {
  constructor(private readonly origin: string) {}

  isWatched(url: string): boolean {
    try {
      const resolved = new URL(url, this.origin);
      return (
        resolved.origin === this.origin && watchedPath.test(resolved.pathname)
      );
    } catch {
      return false;
    }
  }
}
