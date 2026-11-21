import { ATTRIBUTES } from "../../shared/dom";
import { shortcodeFromPath, shortcodeToMediaId } from "../../shared/shortcode";
import type { PostTarget } from "../actions/ports";
import type { PageView } from "../features/feature";
import { carouselSlide } from "./carousel";
import type { AssetFinder, PostLocator } from "./ports";
import { parseRoute } from "./route";

const postLink = 'a[href*="/p/"], a[href*="/reel/"]';

// Tells which post a container shows: by its shortcode when the page names
// one, and by the picture on screen when it does not.
export class PagePostLocator implements PostLocator {
  constructor(
    private readonly view: PageView,
    private readonly assets: AssetFinder,
  ) {}

  target(container: ParentNode, all: boolean): PostTarget | undefined {
    const shortcode = this.shortcode(container);
    if (shortcode !== undefined)
      return {
        mediaId: shortcodeToMediaId(shortcode),
        slide: all ? undefined : carouselSlide(container),
      };
    const asset = this.assets.largest(container);
    return asset === undefined ? undefined : { asset };
  }

  // In the feed each post links to itself; on a post's own page the address
  // names it, and links further down lead to other posts.
  private shortcode(container: ParentNode): string | undefined {
    const route = parseRoute(this.view.pathname());
    if (route.kind === "post") return route.shortcode;
    const href = container
      .querySelector(postLink)
      ?.getAttribute(ATTRIBUTES.href);
    return href ? shortcodeFromPath(href) : undefined;
  }
}
