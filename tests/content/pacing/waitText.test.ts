import { describeWait } from "../../../src/content/pacing/waitText";

it("describes waits in seconds, then minutes and seconds, then whole minutes", () => {
  expect(describeWait("Resting", 1000)).toBe("Resting. Waiting 1 second.");
  expect(describeWait("Resting", 44_500)).toBe("Resting. Waiting 45 seconds.");
  expect(describeWait("Resting", 60_000)).toBe("Resting. Waiting 1 minute.");
  expect(describeWait("Resting", 61_000)).toBe(
    "Resting. Waiting 1 minute 1 second.",
  );
  expect(describeWait("Resting", 80_000)).toBe(
    "Resting. Waiting 1 minute 20 seconds.",
  );
  expect(describeWait("Resting", 120_000)).toBe("Resting. Waiting 2 minutes.");
  expect(describeWait("Slow down", 15 * 60_000)).toBe(
    "Slow down. Waiting 15 minutes.",
  );
  expect(describeWait("Hourly limit", 44 * 60_000 + 10_000)).toBe(
    "Hourly limit. Waiting 45 minutes.",
  );
});
