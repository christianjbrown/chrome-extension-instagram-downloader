import { shortcodeFromPath, shortcodeToMediaId } from "../../shared/shortcode";
import type { PostDownloader } from "../actions/postDownloader";
import { createButton } from "../ui/buttons";
import type { Feature, PageView } from "./feature";

const thumbnail = 'a[href*="/p/"]:has(img), a[href*="/reel/"]:has(img)';
const minimumWidth = 100;

// A download button in the corner of each thumbnail on profile, explore,
// saved and tagged grids. It saves every slide of the post.
export class GridButtons implements Feature {
  constructor(
    private readonly view: PageView,
    private readonly downloader: PostDownloader,
  ) {}

  scan(): void {
    for (const link of this.view.document.querySelectorAll<HTMLAnchorElement>(
      thumbnail,
    )) {
      if (link.classList.contains("igdl-grid-link") || link.closest("article"))
        continue;
      if (link.getBoundingClientRect().width < minimumWidth) continue;
      const shortcode = shortcodeFromPath(link.pathname);
      if (shortcode === undefined) continue;
      link.classList.add("igdl-grid-link");
      link.append(
        createButton(this.view.document, {
          label: "Download post",
          className: "igdl-button igdl-grid-button",
          onClick: () =>
            void this.downloader.download({
              mediaId: shortcodeToMediaId(shortcode),
              slide: undefined,
            }),
        }),
      );
    }
  }
}
