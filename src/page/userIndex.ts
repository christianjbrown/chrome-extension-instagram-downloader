import type { JsonObject } from "../shared/json";
import { isUser } from "./mediaShapes";
import type { KeyedStore, Rememberer, UserLookup } from "./ports";

// Every account Instagram has sent: its id, and its post count when known.
export class UserIndex implements Rememberer, UserLookup {
  constructor(
    private readonly ids: KeyedStore<string>,
    private readonly postCounts: KeyedStore<number>,
  ) {}

  remember(value: JsonObject): void {
    if (isUser(value)) this.rememberUser(value);
  }

  private rememberUser(user: JsonObject & { username: string }): void {
    this.ids.set(user.username, String(user.pk ?? user.id));
    this.rememberCount(user);
  }

  // The profile page's own copy of the account carries its post count.
  private rememberCount(user: JsonObject & { username: string }): void {
    if (typeof user.media_count === "number")
      this.postCounts.set(user.username, user.media_count);
  }

  userId(username: string): string | undefined {
    return this.ids.get(username);
  }

  postCount(username: string): number | undefined {
    return this.postCounts.get(username);
  }
}
