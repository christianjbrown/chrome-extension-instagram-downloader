// One page of who an account follows.
import type { FollowingPage, Input } from "../../shared/bridge";
import { isRecord, type JsonObject } from "../../shared/json";
import { FOLLOWING_PAGE_PROCEDURE } from "../../shared/procedures/followingPage";
import type { FieldCheck, FollowingPages, PageProcedure } from "../ports";

type Name = typeof FOLLOWING_PAGE_PROCEDURE;

export class FollowingPageProcedure implements PageProcedure<Name> {
  readonly name = FOLLOWING_PAGE_PROCEDURE;

  constructor(
    private readonly following: FollowingPages,
    private readonly userId: FieldCheck,
    private readonly next: FieldCheck,
  ) {}

  isInput(input: unknown): input is Input<Name> {
    return isRecord(input) && this.accepts(input);
  }

  private accepts(input: JsonObject): boolean {
    return this.userId.accepts(input.userId) && this.next.accepts(input.next);
  }

  handle({ userId, next }: Input<Name>): Promise<FollowingPage> {
    return this.following.page(userId, next);
  }
}
