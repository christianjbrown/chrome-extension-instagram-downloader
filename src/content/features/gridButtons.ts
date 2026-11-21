import { shortcodeToMediaId } from "../../shared/shortcode";
import type { PostDownloads } from "../actions/ports";
import type { RouteReader, Thumbnail, ThumbnailSource } from "../dom/ports";
import type { ProfileRoute } from "../dom/routes/profile";
import { BUTTON_CLASS, classes } from "../ui/classNames";
import type { IconButtons } from "../ui/ports";
import type { Feature } from "./feature";

// Places the button over a grid thumbnail.
export const GRID_BUTTON_CLASS = "igdl-grid-button";

const label = "Download post";

// A download button in the corner of each grid thumbnail. It saves every
// slide of the post.
export class GridButtons implements Feature {
  constructor(
    private readonly thumbnails: ThumbnailSource,
    private readonly downloader: PostDownloads,
    private readonly profiles: RouteReader<ProfileRoute>,
    private readonly buttons: IconButtons,
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
      className: classes(BUTTON_CLASS, GRID_BUTTON_CLASS),
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
