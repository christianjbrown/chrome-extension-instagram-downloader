import { ATTRIBUTES } from "../../shared/dom";
import { shortcodeFromPath, shortcodeToMediaId } from "../../shared/shortcode";
import type { PostTarget } from "../actions/ports";
import type {
  AssetFinder,
  SlideReader,
  PostLocator,
  RouteReader,
} from "./ports";
import type { PostRoute } from "./routes/post";

const postLink = 'a[href*="/p/"], a[href*="/reel/"]';

const postHref = (container: ParentNode): string | null | undefined =>
  container.querySelector(postLink)?.getAttribute(ATTRIBUTES.href);

function linkedShortcode(container: ParentNode): string | undefined {
  const href = postHref(container);
  return href ? shortcodeFromPath(href) : undefined;
}

// Tells which post a container shows: by its shortcode when the page names
// one, and by the picture on screen when it does not.
export class PagePostLocator implements PostLocator {
  constructor(
    private readonly posts: RouteReader<PostRoute>,
    private readonly assets: AssetFinder,
    private readonly carousel: SlideReader,
  ) {}

  target(container: ParentNode, all: boolean): PostTarget | undefined {
    const shortcode = this.shortcode(container);
    return shortcode === undefined
      ? this.byAsset(container)
      : this.byShortcode(shortcode, container, all);
  }

  private byShortcode(
    shortcode: string,
    container: ParentNode,
    all: boolean,
  ): PostTarget {
    return {
      mediaId: shortcodeToMediaId(shortcode),
      slide: all ? undefined : this.carousel.slide(container),
    };
  }

  private byAsset(container: ParentNode): PostTarget | undefined {
    const asset = this.assets.largest(container);
    return asset === undefined ? undefined : { asset };
  }

  // In the feed each post links to itself; on a post's own page the address
  // names it, and links further down lead to other posts.
  private shortcode(container: ParentNode): string | undefined {
    return this.addressShortcode() ?? linkedShortcode(container);
  }

  private addressShortcode(): string | undefined {
    return this.posts.read()?.shortcode;
  }
}
