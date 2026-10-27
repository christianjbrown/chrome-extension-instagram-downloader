import { TimerSleeper } from "../../../src/content/pacing/sleeper";

describe("TimerSleeper", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves after the wait and stops listening for a stop", async () => {
    const controller = new AbortController();
    const remove = vi.spyOn(controller.signal, "removeEventListener");
    const sleeping = new TimerSleeper().sleep(500, controller.signal);
    await vi.advanceTimersByTimeAsync(500);
    await expect(sleeping).resolves.toBeUndefined();
    expect(remove).toHaveBeenCalled();
  });

  it("rejects at once when already stopped", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      new TimerSleeper().sleep(500, controller.signal),
    ).rejects.toMatchObject({ name: "AbortError" });
  });

  it("rejects when stopped part way", async () => {
    const controller = new AbortController();
    const sleeping = new TimerSleeper().sleep(500, controller.signal);
    controller.abort();
    await expect(sleeping).rejects.toMatchObject({ name: "AbortError" });
  });

  it("waits a random time inside the range", async () => {
    const sleeper = new TimerSleeper(() => 0.5);
    const sleep = vi.spyOn(sleeper, "sleep");
    const waiting = sleeper.between([100, 300], new AbortController().signal);
    await vi.advanceTimersByTimeAsync(200);
    await waiting;
    expect(sleep).toHaveBeenCalledWith(200, expect.anything());
  });
});
