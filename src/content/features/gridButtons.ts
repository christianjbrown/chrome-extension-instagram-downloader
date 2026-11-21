import { shortcodeToMediaId } from "../../shared/shortcode";
import type { PostDownloads } from "../actions/ports";
import type { RouteReader, Thumbnail, ThumbnailSource } from "../dom/ports";
import type { ProfileRoute } from "../dom/route";
import { CLASS, classes } from "../ui/classNames";
import type { ButtonFactory } from "../ui/ports";
import type { Feature } from "./feature";

const label = "Download post";

// A download button in the corner of each grid thumbnail. It saves every
// slide of the post.
export class GridButtons implements Feature {
  constructor(
    private readonly thumbnails: ThumbnailSource,
    private readonly downloader: PostDownloads,
    private readonly profiles: RouteReader<ProfileRoute>,
    private readonly buttons: ButtonFactory,
  ) {}

  scan(): void {
    for (const thumbnail of this.thumbnails.unmarked()) {
      this.thumbnails.mark(thumbnail);
      thumbnail.link.append(this.button(thumbnail));
    }
  }

  private button({ shortcode }: Thumbnail): HTMLButtonElement {
    return this.buttons.button({
      label,
      className: classes(CLASS.button, CLASS.gridButton),
      onClick: () =>
        void this.downloader.download(
          { mediaId: shortcodeToMediaId(shortcode), slide: undefined },
          this.profileOwner(),
        ),
    });
  }

  // On a profile's own grid the posts are almost always that profile's.
  private profileOwner(): string | undefined {
    return this.profiles.read()?.username;
  }
}
