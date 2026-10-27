import type { PostDownloader } from "../../../src/content/actions/postDownloader";
import { GridButtons } from "../../../src/content/features/gridButtons";
import { click, view } from "./view";

function setup(html: string, width = 300) {
  const downloader = { download: vi.fn(() => Promise.resolve()) };
  const feature = new GridButtons(
    view("/alice/", html),
    downloader as unknown as PostDownloader,
  );
  for (const link of document.querySelectorAll("a"))
    link.getBoundingClientRect = () => ({ width }) as DOMRect;
  feature.scan();
  feature.scan();
  return downloader;
}

describe("GridButtons", () => {
  it("adds one button to each grid thumbnail and downloads the whole post", () => {
    const downloader = setup(
      '<a href="/p/De_haHANj_2/"><img></a><a href="/reel/De_haHANj_2/"><img></a>',
    );
    expect(document.querySelectorAll(".igdl-grid-button")).toHaveLength(2);
    click(".igdl-grid-button");
    expect(downloader.download).toHaveBeenCalledWith({
      mediaId: "4017076322398781430",
      slide: undefined,
    });
  });

  it("leaves feed posts, small thumbnails and odd links alone", () => {
    setup(
      '<article><a href="/p/abc/"><img></a></article><a href="/explore/p/"><img></a>',
    );
    expect(document.querySelector(".igdl-grid-button")).toBeNull();
    setup('<a href="/p/abc/"><img></a>', 40);
    expect(document.querySelector(".igdl-grid-button")).toBeNull();
  });
});
