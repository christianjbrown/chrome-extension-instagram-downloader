import { HighlightStories } from "../../../src/content/actions/highlightStories";
import { StoryDownloader } from "../../../src/content/actions/storyDownloader";
import { UserStories } from "../../../src/content/actions/userStories";
import { photo } from "../../fixtures";
import { fakeBridge, notifier } from "../helpers";

function setup() {
  const bridge = fakeBridge({
    media: ({ mediaId }) => photo(mediaId),
    mediaByAsset: () => photo("8"),
    userReel: () => ({ owner: "carol", items: [photo("1"), photo("2")] }),
    reel: () => ({
      owner: undefined,
      items: [
        {
          pk: "3",
          image_versions2: {
            candidates: [{ url: "https://cdn/h.jpg", width: 1, height: 1 }],
          },
        },
      ],
    }),
  });
  const downloader = { download: vi.fn(() => Promise.resolve()) };
  const notes = notifier();
  return {
    bridge,
    downloader,
    notes,
    stories: new StoryDownloader(bridge, downloader, notes, [
      new UserStories(bridge),
      new HighlightStories(bridge),
    ]),
  };
}

const story = (mediaId?: string) =>
  ({ kind: "story", username: "carol", mediaId }) as const;
const highlight = { kind: "highlight", highlightId: "9" } as const;

describe("StoryDownloader", () => {
  it("finds the current story from the address, or from the picture on screen", async () => {
    const { stories, bridge } = setup();
    await stories.current(story("5"), undefined);
    expect(bridge.call).toHaveBeenLastCalledWith("media", { mediaId: "5" });
    await stories.current(story(), "x.jpg");
    await stories.current(highlight, "x.jpg");
    expect(bridge.call).toHaveBeenLastCalledWith("mediaByAsset", {
      asset: "x.jpg",
    });
  });

  it("explains when it cannot tell which story is showing", async () => {
    const { stories, notes } = setup();
    await stories.current(highlight, undefined);
    expect(notes.error).toHaveBeenCalledWith(
      "Could not download this story: could not tell which story is showing",
    );
  });

  it("downloads a whole story or highlight", async () => {
    const { stories, downloader, bridge } = setup();
    await stories.all(story());
    expect(downloader.download).toHaveBeenCalledTimes(2);
    await stories.all(highlight);
    expect(bridge.call).toHaveBeenLastCalledWith("reel", { reelId: "9" });
    expect(downloader.download).toHaveBeenLastCalledWith(
      expect.objectContaining({ username: "unknown" }),
    );
  });

  it("says so when no kind of story page recognises the address", async () => {
    const { bridge, downloader, notes } = setup();
    const stories = new StoryDownloader(bridge, downloader, notes, []);
    await stories.all(highlight);
    expect(notes.error).toHaveBeenCalledWith(
      "Could not download this story: could not tell which story is showing",
    );
    expect(bridge.call).not.toHaveBeenCalled();
  });
});
