import { abortError } from "../../../src/content/errors";
import { RefusedError } from "../../../src/shared/refusal";
import { ApiGate } from "../../../src/content/pacing/apiGate";
import type { HourlyBudget } from "../../../src/content/pacing/hourlyBudget";
import { defaultPacing } from "../../../src/content/pacing/pacing";
import { reporter, signal } from "../helpers";

function gate(backoffMs = [10, 20]) {
  const sleeper = {
    sleep: vi.fn(() => Promise.resolve()),
    between: vi.fn(() => Promise.resolve()),
  };
  const budget = {
    take: vi.fn((_signal: AbortSignal, onWait: (ms: number) => void) => {
      onWait(5);
      return Promise.resolve();
    }),
  };
  return {
    sleeper,
    budget,
    gate: new ApiGate(sleeper, budget as unknown as HourlyBudget, {
      ...defaultPacing,
      backoffMs,
    }),
  };
}

describe("ApiGate", () => {
  it("spaces calls out and reports budget waits", async () => {
    const { gate: g, sleeper } = gate();
    const report = reporter();
    await expect(
      g.call(() => Promise.resolve("ok"), signal(), report),
    ).resolves.toBe("ok");
    expect(sleeper.between).toHaveBeenCalledWith(
      defaultPacing.apiDelayMs,
      expect.anything(),
    );
    expect(report.waiting).toHaveBeenCalledWith(
      "Hourly request limit reached",
      5,
    );
  });

  it("takes from the budget before every attempt, retries included", async () => {
    const { gate: g, budget } = gate();
    const report = reporter();
    const order: string[] = [];
    budget.take.mockImplementation(() => {
      order.push("budget");
      return Promise.resolve();
    });
    const request = vi
      .fn()
      .mockRejectedValueOnce(new RefusedError("429"))
      .mockResolvedValue("ok");
    await g.call(request, signal(), report);
    expect(order).toEqual(["budget", "budget"]);
  });

  it("backs off after a refusal and starts counting again after a success", async () => {
    const { gate: g, sleeper } = gate();
    const report = reporter();
    const request = vi
      .fn()
      .mockRejectedValueOnce(new RefusedError("429"))
      .mockResolvedValue("ok");
    await g.call(request, signal(), report);
    expect(sleeper.sleep).toHaveBeenCalledWith(10, expect.anything());
    expect(report.waiting).toHaveBeenCalledWith(
      "Instagram asked us to slow down",
      10,
    );
    request.mockRejectedValueOnce(new RefusedError("429"));
    await g.call(request, signal(), report);
    expect(sleeper.sleep).toHaveBeenLastCalledWith(10, expect.anything());
  });

  it("gives up once every backoff is spent, then starts afresh", async () => {
    const { gate: g, sleeper } = gate([10]);
    const refused = () => Promise.reject(new RefusedError("429"));
    await expect(g.call(refused, signal(), reporter())).rejects.toMatchObject({
      name: "BlockedError",
    });
    await expect(g.call(refused, signal(), reporter())).rejects.toMatchObject({
      name: "BlockedError",
    });
    expect(sleeper.sleep).toHaveBeenCalledTimes(2);
  });

  it("stops straight away when the run is stopped", async () => {
    const { gate: g, sleeper } = gate();
    await expect(
      g.call(() => Promise.reject(abortError()), signal(), reporter()),
    ).rejects.toMatchObject({
      name: "AbortError",
    });
    expect(sleeper.sleep).not.toHaveBeenCalled();
  });

  it("passes any other failure straight on without waiting", async () => {
    const { gate: g, sleeper } = gate();
    await expect(
      g.call(
        () => Promise.reject(new Error("The page sent an unexpected address")),
        signal(),
        reporter(),
      ),
    ).rejects.toThrow("The page sent an unexpected address");
    expect(sleeper.sleep).not.toHaveBeenCalled();
  });
});
