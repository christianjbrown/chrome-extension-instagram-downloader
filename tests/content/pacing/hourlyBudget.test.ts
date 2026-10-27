import { HourlyBudget } from "../../../src/content/pacing/hourlyBudget";
import { signal } from "../helpers";

it("lets calls through until the hourly limit, then waits for the oldest to expire", async () => {
  let now = 0;
  const sleeper = {
    sleep: vi.fn((ms: number) => {
      now += ms;
      return Promise.resolve();
    }),
    between: vi.fn(),
  };
  const budget = new HourlyBudget(2, sleeper, () => now);
  const onWait = vi.fn();
  await budget.take(signal(), onWait);
  now = 1000;
  await budget.take(signal(), onWait);
  await budget.take(signal(), onWait);
  expect(onWait).toHaveBeenCalledWith(3_599_000);
  expect(sleeper.sleep).toHaveBeenCalledTimes(1);
});
