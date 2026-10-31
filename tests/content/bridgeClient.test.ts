import { PageBridge } from "../../src/content/bridgeClient";
import { TimeoutScheduler } from "../../src/content/scheduler";
import { ManualScheduler } from "./helpers";

const origin = "https://www.instagram.com";

function bridge(post = vi.fn(), scheduler = new ManualScheduler()) {
  return new PageBridge(post, {
    pageOrigin: origin,
    newChannel: () => new MessageChannel(),
    scheduler,
    timeoutMs: 1000,
  });
}

describe("PageBridge", () => {
  const answering = (response: unknown) =>
    vi.fn((_message: unknown, _origin: string, [port]: Transferable[]) => {
      (port as MessagePort).postMessage(response);
    });

  it("posts the request to the page and resolves with its answer", async () => {
    const post = answering({ ok: true, value: { id: "1" } });
    const scheduler = new ManualScheduler();
    await expect(bridge(post, scheduler).call("viewer", {})).resolves.toEqual({
      id: "1",
    });
    expect(post).toHaveBeenCalledWith(
      { igdlProcedure: "viewer", input: {} },
      origin,
      [expect.anything()],
    );
    expect(scheduler.pending.size).toBe(0);
  });

  it("rejects with the page's error", async () => {
    await expect(
      bridge(answering({ ok: false, error: "nope" })).call("viewer", {}),
    ).rejects.toThrow("nope");
  });

  it("rejects, rather than hanging, on a reply of the wrong shape", async () => {
    for (const reply of [null, "text", 5, {}, { ok: false }, { ok: 1 }])
      await expect(bridge(answering(reply)).call("viewer", {})).rejects.toThrow(
        "unreadable",
      );
  });

  it("gives up when the page never answers", async () => {
    const scheduler = new ManualScheduler();
    const pending = bridge(vi.fn(), scheduler).call("viewer", {});
    expect([...scheduler.pending.values()][0]?.ms).toBe(1000);
    scheduler.runAll();
    await expect(pending).rejects.toThrow("The page did not answer");
  });
});

it("waits a minute by default", () => {
  const scheduler = new ManualScheduler();
  void new PageBridge(vi.fn(), {
    pageOrigin: origin,
    newChannel: () => new MessageChannel(),
    scheduler,
  }).call("viewer", {});
  expect([...scheduler.pending.values()][0]?.ms).toBe(60_000);
});

describe("TimeoutScheduler", () => {
  it("runs the callback after the delay, unless cancelled", () => {
    vi.useFakeTimers();
    const ran = vi.fn();
    const scheduler = new TimeoutScheduler();
    scheduler.after(10, ran);
    scheduler.after(10, ran)();
    vi.advanceTimersByTime(10);
    expect(ran).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
