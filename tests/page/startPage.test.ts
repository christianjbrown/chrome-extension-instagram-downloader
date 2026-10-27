import { scanEmbeddedJson, startPage } from "../../src/page/startPage";
import { photo } from "../fixtures";

class FakeXhr {
  open(): void {
    // The page script only wraps it.
  }
  send(): void {
    // The page script only wraps it.
  }
}

function fakeWindow(readyState: DocumentReadyState) {
  document.body.innerHTML = "";
  const script = document.createElement("script");
  script.type = "application/json";
  script.textContent = JSON.stringify({ deep: photo("5", "embedded.jpg") });
  document.body.append(script);
  Object.defineProperty(document, "readyState", {
    value: readyState,
    configurable: true,
  });
  const listeners: ((event: MessageEvent) => void)[] = [];
  const fetch = vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify({ users: [{ username: "a" }] })),
    ),
  );
  const target = {
    XMLHttpRequest: FakeXhr,
    fetch,
    document,
    require: (name: string) =>
      ({
        PolarisConfig: { getIGAppID: () => "app" },
        PolarisWWWClaim: { getWWWClaim: () => "claim" },
      })[name],
    addEventListener: (
      _type: string,
      listener: (event: MessageEvent) => void,
    ) => listeners.push(listener),
  };
  startPage(target as never);
  const ask = async (igdlProcedure: string, input: unknown) => {
    const port = { postMessage: vi.fn() };
    listeners[0]?.({
      origin: "https://www.instagram.com",
      ports: [port],
      data: { igdlProcedure, input },
    } as never);
    await vi.waitFor(() => {
      expect(port.postMessage).toHaveBeenCalled();
    });
    return port.postMessage.mock.calls[0]?.[0] as {
      ok: boolean;
      value: unknown;
    };
  };
  return { ask, fetch };
}

describe("startPage", () => {
  it("reads embedded data at once when the document has loaded", async () => {
    const { ask, fetch } = fakeWindow("complete");
    await expect(
      ask("mediaByAsset", { asset: "embedded.jpg" }),
    ).resolves.toMatchObject({ ok: true });
    await expect(
      ask("followingPage", { userId: "1", next: undefined }),
    ).resolves.toMatchObject({
      value: { usernames: ["a"] },
    });
    expect(fetch).toHaveBeenCalled();
  });

  it("waits for the document while it is still loading", async () => {
    const { ask } = fakeWindow("loading");
    await expect(
      ask("mediaByAsset", { asset: "embedded.jpg" }),
    ).resolves.toMatchObject({ ok: false });
    document.dispatchEvent(new Event("DOMContentLoaded"));
    await expect(
      ask("mediaByAsset", { asset: "embedded.jpg" }),
    ).resolves.toMatchObject({ ok: true });
  });
});

it("scanEmbeddedJson feeds every embedded document to the sink", () => {
  document.body.innerHTML =
    '<script type="application/json">{"a":1}</script><script type="application/json"></script>';
  const sink = vi.fn();
  scanEmbeddedJson(document, sink);
  expect(sink).toHaveBeenCalledTimes(1);
});
