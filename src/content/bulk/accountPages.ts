import type { PostsPage } from "../../shared/bridge";
import type { Bridge } from "../ports";
import type { Gate } from "../pacing/ports";
import type {
  AccountPages,
  ArchiveRequest,
  CatchUpPolicy,
  PageVisitor,
  PostTotals,
} from "./ports";

const firstPage = 1;

export interface AccountPagesDependencies {
  readonly bridge: Bridge;
  readonly gate: Gate;
  readonly totals: PostTotals;
  readonly catchUp: CatchUpPolicy;
}

// Asks for an account's posts a page at a time, through the API gate, until
// the last page or until a rerun reaches the posts saved before.
export class CatchingUpPages implements AccountPages {
  constructor(private readonly deps: AccountPagesDependencies) {}

  walk(request: ArchiveRequest, visitor: PageVisitor): Promise<void> {
    return this.walkFrom(request, visitor, undefined, firstPage);
  }

  private async walkFrom(
    request: ArchiveRequest,
    visitor: PageVisitor,
    cursor: string | undefined,
    page: number,
  ): Promise<void> {
    const result = await this.postsPage(request, cursor);
    await this.lookUpTotal(request, visitor, result, page);
    const newFiles = await visitor.page(result);
    const next = this.next(request, result, page, newFiles);
    if (next !== undefined)
      await this.walkFrom(request, visitor, next, page + 1);
  }

  private async lookUpTotal(
    { username, onlyNew, signal, reporter }: ArchiveRequest,
    visitor: PageVisitor,
    result: PostsPage,
    page: number,
  ): Promise<void> {
    if (this.deps.catchUp.wantsTotal(page, onlyNew))
      visitor.total(
        await this.deps.totals.find(username, result, signal, reporter),
      );
  }

  // The cursor of the page after this one, or undefined once there is no
  // need to go on.
  private next(
    { onlyNew }: ArchiveRequest,
    result: PostsPage,
    page: number,
    newFiles: number,
  ): string | undefined {
    return this.deps.catchUp.caughtUp(page, onlyNew, newFiles)
      ? undefined
      : result.cursor;
  }

  private postsPage(
    { username, signal, reporter }: ArchiveRequest,
    cursor: string | undefined,
  ): Promise<PostsPage> {
    return this.deps.gate.call(
      () => this.deps.bridge.call("postsPage", { username, cursor }),
      signal,
      reporter,
    );
  }
}
