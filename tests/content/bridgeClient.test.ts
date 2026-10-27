import { PageBridge } from "../../src/content/bridgeClient";

describe("PageBridge", () => {
  const answering = (response: unknown) =>
    vi.fn((_message: unknown, _origin: string, [port]: Transferable[]) => {
      (port as MessagePort).postMessage(response);
    });

  it("posts the request to the page and resolves with its answer", async () => {
    const post = answering({ ok: true, value: { id: "1" } });
    await expect(new PageBridge(post).call("viewer", {})).resolves.toEqual({
      id: "1",
    });
    expect(post).toHaveBeenCalledWith(
      { igdlProcedure: "viewer", input: {} },
      "https://www.instagram.com",
      [expect.anything()],
    );
  });

  it("rejects with the page's error", async () => {
    await expect(
      new PageBridge(answering({ ok: false, error: "nope" })).call(
        "viewer",
        {},
      ),
    ).rejects.toThrow("nope");
  });

  it("gives up when the page never answers", async () => {
    vi.useFakeTimers();
    const pending = new PageBridge(vi.fn(), 1000).call("viewer", {});
    vi.advanceTimersByTime(1000);
    await expect(pending).rejects.toThrow("The page did not answer");
    vi.useRealTimers();
  });
});
