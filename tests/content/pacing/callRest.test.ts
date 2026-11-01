import { RestEveryCalls } from "../../../src/content/pacing/callRest";
import { reporter, signal } from "../helpers";

function rest(random = () => 0.5) {
  const sleeper = {
    sleep: vi.fn(() => Promise.resolve()),
    between: vi.fn(() => Promise.resolve()),
  };
  return {
    sleeper,
    rest: new RestEveryCalls(
      { restEveryCalls: 3, restDelayMs: [30_000, 90_000] },
      sleeper,
      random,
    ),
  };
}

describe("RestEveryCalls", () => {
  it("rests before every fourth call, not before the first", async () => {
    const { rest: r, sleeper } = rest();
    const report = reporter();
    for (let call = 0; call < 7; call += 1) {
      await r.before(signal(), report);
    }
    expect(sleeper.sleep).toHaveBeenCalledTimes(2);
    expect(sleeper.sleep).toHaveBeenCalledWith(60_000, expect.anything());
    expect(report.waiting).toHaveBeenCalledWith(
      "Resting after 3 requests",
      60_000,
    );
  });

  it("picks the rest at random within the range", async () => {
    const { rest: r, sleeper } = rest(() => 0);
    const report = reporter();
    for (let call = 0; call < 4; call += 1) {
      await r.before(signal(), report);
    }
    expect(sleeper.sleep).toHaveBeenCalledWith(30_000, expect.anything());
  });

  it("does not touch the random wait between calls", async () => {
    const { rest: r, sleeper } = rest();
    await r.before(signal(), reporter());
    expect(sleeper.between).not.toHaveBeenCalled();
    expect(sleeper.sleep).not.toHaveBeenCalled();
  });
});
