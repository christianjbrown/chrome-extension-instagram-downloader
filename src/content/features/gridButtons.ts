import { shortcodeFromPath, shortcodeToMediaId } from "../../shared/shortcode";
import type { PostDownloader } from "../actions/postDownloader";
import { parseRoute } from "../dom/route";
import { ARTICLE } from "../dom/selectors";
import { createButton } from "../ui/buttons";
import { CLASS, classes } from "../ui/classNames";
import type { Feature, PageView } from "./feature";

const thumbnail = 'a[href*="/p/"]:has(img), a[href*="/reel/"]:has(img)';
const label = "Download post";

// A download button in the corner of each thumbnail on profile, explore,
// saved and tagged grids. It saves every slide of the post.
export class GridButtons implements Feature {
  constructor(
    private readonly view: PageView,
    private readonly downloader: PostDownloader,
    private readonly minimumWidth: number,
  ) {}

  scan(): void {
    for (const link of this.view.document.querySelectorAll<HTMLAnchorElement>(
      thumbnail,
    )) {
      if (link.classList.contains(CLASS.gridLink) || link.closest(ARTICLE))
        continue;
      if (link.getBoundingClientRect().width < this.minimumWidth) continue;
      const shortcode = shortcodeFromPath(link.pathname);
      if (shortcode === undefined) continue;
      link.classList.add(CLASS.gridLink);
      link.append(
        createButton(this.view.document, {
          label,
          className: classes(CLASS.button, CLASS.gridButton),
          onClick: () =>
            void this.downloader.download(
              { mediaId: shortcodeToMediaId(shortcode), slide: undefined },
              this.profileOwner(),
            ),
        }),
      );
    }
  }

  // On a profile's own grid the posts are almost always that profile's.
  private profileOwner(): string | undefined {
    const route = parseRoute(this.view.pathname());
    return route.kind === "profile" ? route.username : undefined;
  }
}
