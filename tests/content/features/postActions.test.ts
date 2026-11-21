import { PostActions } from "../../../src/content/features/postActions";
import { notifier } from "../helpers";
import { assets, bookmark, click, view } from "./view";

function setup(path: string, html: string) {
  const downloader = { download: vi.fn(() => Promise.resolve()) };
  const notes = notifier();
  const feature = new PostActions(
    view(path, html),
    downloader,
    notes,
    assets(),
  );
  feature.scan();
  return { downloader, notes, feature };
}

const actionBar = () =>
  `<section><span>like</span><span><div role="button">${bookmark}</div></span></section>`;
const dots =
  '<div><button aria-label="Go to slide 1"></button><button aria-current="step" aria-label="Go to slide 2"></button></div>';

describe("PostActions", () => {
  it("adds a download button beside a feed post's bookmark, once", () => {
    const { feature } = setup(
      "/",
      `<article><a href="/p/DaBcdEfGh_1/">time</a>${actionBar()}</article>`,
    );
    feature.scan();
    const group = document.querySelectorAll(".igdl-post-actions");
    expect(group).toHaveLength(1);
    expect(group[0]?.nextElementSibling?.tagName).toBe("SPAN");
    expect(document.querySelector(".igdl-download-all")).toBeNull();
  });

  it("joins the other actions when the bookmark has a grid cell to itself", () => {
    const { feature } = setup(
      "/",
      `<article><a href="/p/DaBcdEfGh_1/">time</a><section><div><span>like</span><span>share</span></div><div><div role="button">${bookmark}</div></div></section></article>`,
    );
    feature.scan();
    const group = document.querySelectorAll(".igdl-post-actions");
    expect(group).toHaveLength(1);
    expect(group[0]?.previousElementSibling?.textContent).toBe("share");
    expect(document.querySelector("section")?.childElementCount).toBe(2);
  });

  it("downloads a feed post by the link inside it", async () => {
    const { downloader } = setup(
      "/",
      `<article><a href="/p/DaBcdEfGh_1/">time</a>${actionBar()}</article>`,
    );
    click(".igdl-download");
    await vi.waitFor(() => {
      expect(downloader.download).toHaveBeenCalledWith({
        mediaId: "3927545493027692533",
        slide: undefined,
      });
    });
  });

  it("offers the showing slide and all slides on a carousel", async () => {
    const { downloader } = setup(
      "/",
      `<article><a href="/p/DaBcdEfGh_1/">t</a>${dots}${actionBar()}</article>`,
    );
    click(".igdl-download");
    click(".igdl-download-all");
    await vi.waitFor(() => {
      expect(downloader.download).toHaveBeenCalledWith({
        mediaId: "3927545493027692533",
        slide: 1,
      });
      expect(downloader.download).toHaveBeenCalledWith({
        mediaId: "3927545493027692533",
        slide: undefined,
      });
    });
  });

  it("uses the address on a post's own page", async () => {
    const { downloader } = setup(
      "/p/DaBcdEfGh_1/",
      `<main><a href="/p/Other/">more</a>${actionBar()}</main>`,
    );
    click(".igdl-download");
    await vi.waitFor(() => {
      expect(downloader.download).toHaveBeenCalledWith({
        mediaId: "3927545493027692533",
        slide: undefined,
      });
    });
  });

  it("falls back to the picture on screen when the post has no link", async () => {
    const { downloader } = setup(
      "/",
      `<article><img src="https://cdn/pic.jpg">${actionBar()}</article>`,
    );
    const image = document.querySelector("img")!;
    image.getBoundingClientRect = () =>
      ({ top: 0, bottom: 400, width: 400, height: 400 }) as DOMRect;
    click(".igdl-download");
    await vi.waitFor(() => {
      expect(downloader.download).toHaveBeenCalledWith({ asset: "pic.jpg" });
    });
  });

  it("explains when it cannot tell which post it is", () => {
    const { notes, downloader } = setup("/", actionBar());
    click(".igdl-download");
    expect(notes.error).toHaveBeenCalledWith(
      "Could not tell which post this is.",
    );
    expect(downloader.download).not.toHaveBeenCalled();
  });

  it("skips a bookmark that is not inside a button", () => {
    setup("/", `<article>${bookmark}</article>`);
    expect(document.querySelector(".igdl-post-actions")).toBeNull();
  });
});
