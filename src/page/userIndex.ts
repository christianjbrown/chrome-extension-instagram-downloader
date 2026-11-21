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
    if (!isUser(value)) return;
    const username = value.username as string;
    this.ids.set(username, String(value.pk ?? value.id));
    // The profile page's own copy of the account carries its post count.
    if (typeof value.media_count === "number")
      this.postCounts.set(username, value.media_count);
  }

  userId(username: string): string | undefined {
    return this.ids.get(username);
  }

  postCount(username: string): number | undefined {
    return this.postCounts.get(username);
  }
}
