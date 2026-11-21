import { IDBFactory } from "fake-indexeddb";
import { CONTENT_CONFIG } from "../../src/content/config";
import { startContent } from "../../src/content/startContent";
import type { ContentEnvironment } from "../../src/content/wiring";

function environment() {
  document.body.innerHTML = "<main><header></header></main>";
  const answers: Record<string, unknown> = {
    account: {
      id: "9",
      username: "alice",
      profilePicUrl: "https://scontent.cdninstagram.com/p.jpg",
      totalPosts: 1,
    },
    viewer: { id: "1", username: "me" },
  };
  const postMessage = vi.fn(
    (
      message: { igdlProcedure: string },
      _origin: string,
      [port]: MessagePort[],
    ) => {
      port?.postMessage({ ok: true, value: answers[message.igdlProcedure] });
    },
  );
  const fetch = vi.fn(() => Promise.resolve(new Response("image")));
  const showDirectoryPicker = vi.fn(() =>
    Promise.reject(new Error("cancelled")),
  );
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => undefined);
  const target = {
    document,
    location: { pathname: "/alice/" },
    innerHeight: 800,
    postMessage,
    fetch,
    showDirectoryPicker,
    indexedDB: new IDBFactory(),
    MutationObserver,
    MessageChannel,
    setTimeout: (callback: () => void, ms: number) => setTimeout(callback, ms),
    clearTimeout: (timer: number) => {
      clearTimeout(timer);
    },
    URL: { createObjectURL: () => "blob:1", revokeObjectURL: vi.fn() },
  };
  const storage = {
    get: () => Promise.resolve({}),
    set: () => Promise.resolve(),
  };
  startContent(
    { window: target, storage } as unknown as ContentEnvironment,
    CONTENT_CONFIG,
  );
  return { postMessage, fetch, showDirectoryPicker, click };
}

const press = (label: string) =>
  Array.from(document.querySelectorAll<HTMLButtonElement>("button"))
    .find((b) => b.textContent === label)
    ?.click();

describe("startContent", () => {
  it("adds the profile toolbar and wires its buttons through to the page and the network", async () => {
    const { postMessage, fetch, showDirectoryPicker, click } = environment();
    expect(document.querySelector(".igdl-profile-toolbar")).not.toBeNull();
    press("Download profile picture");
    await vi.waitFor(() => {
      expect(click).toHaveBeenCalled();
    });
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ igdlProcedure: "account" }),
      "https://www.instagram.com",
      expect.anything(),
    );
    expect(fetch).toHaveBeenCalledWith(
      "https://scontent.cdninstagram.com/p.jpg",
    );
    press("Change download folder");
    await vi.waitFor(() => {
      expect(showDirectoryPicker).toHaveBeenCalled();
    });
  });

  it("reads the viewport for the post buttons", async () => {
    environment();
    document.body.innerHTML =
      '<article><img src="https://cdn.example/x.jpg"><section><span>like</span><span><div role="button"><svg><polygon points="20 21 12 13.44 4 21 4 3 20 3 20 21"></polygon></svg></div></span></section></article>';
    await vi.waitFor(() => {
      expect(document.querySelector(".igdl-download")).not.toBeNull();
    });
    const image = document.querySelector("img")!;
    const height = vi.fn(
      () => ({ top: 0, bottom: 400, width: 400, height: 400 }) as DOMRect,
    );
    image.getBoundingClientRect = height;
    document.querySelector<HTMLButtonElement>(".igdl-download")?.click();
    expect(height).toHaveBeenCalled();
  });

  it("rescans when the page changes", async () => {
    environment();
    document.querySelector(".igdl-profile-toolbar")?.remove();
    document.body.append(document.createElement("div"));
    await vi.waitFor(() => {
      expect(document.querySelector(".igdl-profile-toolbar")).not.toBeNull();
    });
  });
});
