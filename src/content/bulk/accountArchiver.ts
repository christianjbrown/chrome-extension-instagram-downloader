import type { PostsPage } from "../../shared/bridge";
import type { InstagramMedia } from "../../shared/media";
import type { MediaFiles } from "../ports";
import type {
  AccountPages,
  AccountTally,
  ArchiveRequest,
  Archiver,
  ItemSaver,
  TallyStarter,
} from "./ports";
import type { Counts } from "./counts";

export interface ArchiverDependencies {
  readonly files: MediaFiles;
  readonly pages: AccountPages;
  readonly saver: ItemSaver;
  readonly tallies: TallyStarter;
}

// Writes every post of one account into folder/<username>/. Going through
// the pages, saving each file and keeping count are each their own part.
export class AccountArchiver implements Archiver {
  constructor(private readonly deps: ArchiverDependencies) {}

  async archive(request: ArchiveRequest): Promise<Counts> {
    const folder = await request.folder.getDirectoryHandle(request.username, {
      create: true,
    });
    const tally = this.deps.tallies.start(request.reporter);
    tally.begin();
    await this.deps.pages.walk(request, {
      total: (total) => {
        tally.total(total);
      },
      page: (result) => this.writePage(folder, result, tally, request),
    });
    return tally.finish();
  }

  private async writePage(
    folder: FileSystemDirectoryHandle,
    result: PostsPage,
    tally: AccountTally,
    request: ArchiveRequest,
  ): Promise<number> {
    const before = tally.saved();
    tally.unreadable(result.unreadable);
    for (const media of result.items)
      await this.writeMedia(folder, media, tally, request);
    return tally.saved() - before;
  }

  private async writeMedia(
    folder: FileSystemDirectoryHandle,
    media: InstagramMedia,
    tally: AccountTally,
    { username, signal }: ArchiveRequest,
  ): Promise<void> {
    tally.nextPost();
    for (const item of this.deps.files.items(media, username))
      tally.file(await this.deps.saver.save(folder, item, signal));
  }
}
