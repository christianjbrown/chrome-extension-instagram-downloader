import { StoryToolbar } from "../../../src/content/features/storyToolbar";
import { assets, buttons, routes, view } from "./view";

function setup(path: string) {
  const downloader = {
    current: vi.fn(() => Promise.resolve()),
    all: vi.fn(() => Promise.resolve()),
  };
  const page = view(path, '<img src="https://cdn/story.jpg">');
  document.querySelector("img")!.getBoundingClientRect = () =>
    ({ top: 0, bottom: 500, width: 400, height: 500 }) as DOMRect;
  const feature = new StoryToolbar({
    document,
    downloader,
    assets: assets(),
    stories: routes(page).stories,
    buttons: buttons(),
  });
  feature.scan();
  return { downloader, feature, page };
}

const press = (label: string) =>
  Array.from(
    document.querySelectorAll<HTMLButtonElement>(".igdl-story-toolbar button"),
  )
    .find((b) => b.textContent === label)
    ?.click();

describe("StoryToolbar", () => {
  it("shows once over a story and downloads the current or every story", () => {
    const { downloader, feature } = setup("/stories/carol/5/");
    feature.scan();
    expect(document.querySelectorAll(".igdl-story-toolbar")).toHaveLength(1);
    expect(
      Array.from(
        document.querySelectorAll(".igdl-story-toolbar button"),
        (b) => b.className,
      ),
    ).toEqual([
      "igdl-text-button igdl-icon-download",
      "igdl-text-button igdl-icon-download-all",
    ]);
    press("Download this story");
    press("Download all");
    expect(downloader.current).toHaveBeenCalledWith(
      { kind: "story", username: "carol", mediaId: "5" },
      "story.jpg",
    );
    expect(downloader.all).toHaveBeenCalledWith({
      kind: "story",
      username: "carol",
      mediaId: "5",
    });
  });

  it("works for highlights and goes away when the viewer closes", () => {
    const { downloader, feature, page } = setup("/stories/highlights/9/");
    press("Download all");
    expect(downloader.all).toHaveBeenCalledWith({
      kind: "highlight",
      highlightId: "9",
    });
    page.setPath("/carol/");
    press("Download all");
    expect(downloader.all).toHaveBeenCalledTimes(1);
    feature.scan();
    expect(document.querySelector(".igdl-story-toolbar")).toBeNull();
    feature.scan();
  });
});
