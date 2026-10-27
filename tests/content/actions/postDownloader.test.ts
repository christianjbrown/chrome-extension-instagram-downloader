import { PostDownloader } from "../../../src/content/actions/postDownloader";
import { photo } from "../../fixtures";
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
    posts: new PostDownloader(bridge, downloader, notes),
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
