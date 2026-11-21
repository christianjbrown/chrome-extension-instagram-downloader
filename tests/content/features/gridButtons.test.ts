import { GridButtons } from "../../../src/content/features/gridButtons";
import { GridThumbnails } from "../../../src/content/dom/gridThumbnails";
import { buttons, click, routes, view } from "./view";

function setup(html: string, width = 300, path = "/alice/") {
  const downloader = { download: vi.fn(() => Promise.resolve()) };
  const page = view(path, html);
  const feature = new GridButtons(
    new GridThumbnails(document, 100, HTMLAnchorElement),
    downloader,
    routes(page).profiles,
    buttons(),
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
      '<a href="/p/DaBcdEfGh_1/"><img></a><a href="/reel/DaBcdEfGh_1/"><img></a>',
    );
    expect(document.querySelectorAll(".igdl-grid-button")).toHaveLength(2);
    click(".igdl-grid-button");
    expect(downloader.download).toHaveBeenCalledWith(
      { mediaId: "3927545493027692533", slide: undefined },
      "alice",
    );
  });

  it("names no owner on a grid that is not a profile", () => {
    const downloader = setup(
      '<a href="/p/DaBcdEfGh_1/"><img></a>',
      300,
      "/explore/",
    );
    click(".igdl-grid-button");
    expect(downloader.download).toHaveBeenCalledWith(
      { mediaId: "3927545493027692533", slide: undefined },
      undefined,
    );
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
