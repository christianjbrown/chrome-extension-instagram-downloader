import {
  defaultPacing,
  describeWait,
} from "../../../src/content/pacing/pacing";

it("describes waits in whole minutes", () => {
  expect(describeWait("Slow down", 60_000)).toBe(
    "Slow down. Waiting 1 minute.",
  );
  expect(describeWait("Slow down", 61_000)).toBe(
    "Slow down. Waiting 2 minutes.",
  );
});

it("keeps the default pace well under an API call a minute", () => {
  expect(defaultPacing.apiCallsPerHour).toBeLessThanOrEqual(120);
  expect(defaultPacing.backoffMs).toHaveLength(4);
});
