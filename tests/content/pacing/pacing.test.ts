import {
  defaultPacing,
  describeWait,
} from "../../../src/content/pacing/pacing";

it("describes short waits in seconds and longer ones in whole minutes", () => {
  expect(describeWait("Resting", 1000)).toBe("Resting. Waiting 1 second.");
  expect(describeWait("Resting", 44_500)).toBe("Resting. Waiting 45 seconds.");
  expect(describeWait("Slow down", 60_000)).toBe(
    "Slow down. Waiting 1 minute.",
  );
  expect(describeWait("Slow down", 61_000)).toBe(
    "Slow down. Waiting 2 minutes.",
  );
});

it("keeps the hourly ceiling a backstop behind the delays and rests", () => {
  const hour = 3_600_000;
  const { apiDelayMs, restEveryCalls, restDelayMs } = defaultPacing;
  const average = ([min, max]: readonly [number, number]) => (min + max) / 2;
  // What a run makes in an hour when every wait lands at the given point.
  const callsAnHour = (delay: number, rest: number) =>
    hour / (delay + rest / restEveryCalls);
  const typical = callsAnHour(average(apiDelayMs), average(restDelayMs));
  const quickest = callsAnHour(apiDelayMs[0], restDelayMs[0]);
  expect(defaultPacing.apiCallsPerHour).toBeGreaterThan(typical);
  expect(defaultPacing.apiCallsPerHour).toBeLessThan(quickest);
  expect(defaultPacing.backoffMs).toHaveLength(4);
});
