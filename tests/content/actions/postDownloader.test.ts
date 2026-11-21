import { SlideFiles } from "../../../src/content/mediaFiles";
import { PostDownloader } from "../../../src/content/actions/postDownloader";
import { cdn, photo } from "../../fixtures";
import { fakeBridge, notifier } from "../helpers";

function setup() {
  const carousel = {
    ...photo("1"),
    carousel_media: [photo("11", "s1.jpg"), photo("12", "s2.jpg")],
  };
  const bridge = fakeBridge({
    media: ({ mediaId }) => (mediaId === "1" ? carousel : { pk: mediaId }),
    mediaByAsset: () => photo("12", "s2.jpg"),
  });
  const downloader = { download: vi.fn(() => Promise.resolve()) };
  const notes = notifier();
  return {
    downloader,
    notes,
    posts: new PostDownloader(bridge, downloader, notes, new SlideFiles()),
  };
}

const ids = (downloader: { download: ReturnType<typeof vi.fn> }) =>
  downloader.download.mock.calls.map(([item]) => (item as { id: string }).id);

describe("PostDownloader", () => {
  it("downloads every slide, or just the one showing", async () => {
    const { posts, downloader } = setup();
    await posts.download({ mediaId: "1", slide: undefined });
    expect(ids(downloader)).toEqual(["11_1", "12_1"]);
    downloader.download.mockClear();
    await posts.download({ mediaId: "1", slide: 1 });
    expect(ids(downloader)).toEqual(["12_1"]);
  });

  it("names the files after the given owner when the post does not say", async () => {
    const { posts, downloader } = setup();
    const anonymous = {
      pk: "3",
      image_versions2: {
        candidates: [{ url: cdn("3.jpg"), width: 1, height: 1 }],
      },
    };
    const bridge = fakeBridge({ media: () => anonymous });
    await new PostDownloader(
      bridge,
      downloader,
      notifier(),
      new SlideFiles(),
    ).download({ mediaId: "3", slide: undefined }, "bob");
    expect(downloader.download).toHaveBeenCalledWith(
      expect.objectContaining({ username: "bob" }),
    );
    downloader.download.mockClear();
    await posts.download({ mediaId: "1", slide: 0 }, "bob");
    expect(downloader.download).toHaveBeenCalledWith(
      expect.objectContaining({ username: "alice" }),
    );
  });

  it("finds a post by the picture on screen", async () => {
    const { posts, downloader } = setup();
    await posts.download({ asset: "s2.jpg" });
    expect(ids(downloader)).toEqual(["12_1"]);
  });

  it("explains when there is nothing to download or the post cannot be found", async () => {
    const { posts, notes } = setup();
    await posts.download({ mediaId: "2", slide: undefined });
    expect(notes.error).toHaveBeenCalledWith(
      "Could not download this post: nothing to download",
    );
    await posts.download({ mediaId: "1", slide: 7 });
    expect(notes.error).toHaveBeenCalledTimes(2);
  });
});
