import { SteppedBackoff } from "../../../src/content/pacing/steppedBackoff";

describe("SteppedBackoff", () => {
  it("waits longer after each refusal in a row", () => {
    const backoff = new SteppedBackoff([10, 20]);
    expect([backoff.next(), backoff.next()]).toEqual([10, 20]);
  });

  it("runs out after the last wait, then starts afresh", () => {
    const backoff = new SteppedBackoff([10]);
    expect([backoff.next(), backoff.next(), backoff.next()]).toEqual([
      10,
      undefined,
      10,
    ]);
  });

  it("starts again after a success", () => {
    const backoff = new SteppedBackoff([10, 20]);
    backoff.next();
    backoff.reset();
    expect(backoff.next()).toBe(10);
  });
});
