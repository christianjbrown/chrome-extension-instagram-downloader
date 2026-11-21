import {
  AnyStopPolicy,
  ReloadedExtensionPolicy,
  StopOrBlockPolicy,
} from "../../../src/content/bulk/stopPolicies";
import { BlockedError, abortError } from "../../../src/content/errors";

const reloaded = new Error("Extension context invalidated.");

describe("StopOrBlockPolicy", () => {
  it("ends the run on a stop or a block and nothing else", () => {
    const policy = new StopOrBlockPolicy();
    expect(policy.endsTheRun(abortError())).toBe(true);
    expect(policy.endsTheRun(new BlockedError("blocked"))).toBe(true);
    expect(policy.endsTheRun(new Error("x"))).toBe(false);
    expect(policy.endsTheRun(reloaded)).toBe(false);
  });
});

describe("ReloadedExtensionPolicy", () => {
  it("ends the run once the extension has been reloaded", () => {
    const policy = new ReloadedExtensionPolicy();
    expect(policy.endsTheRun(reloaded)).toBe(true);
    expect(policy.endsTheRun(abortError())).toBe(false);
  });
});

describe("AnyStopPolicy", () => {
  it("ends the run when any of its policies would", () => {
    const policy = new AnyStopPolicy([
      new StopOrBlockPolicy(),
      new ReloadedExtensionPolicy(),
    ]);
    expect(policy.endsTheRun(abortError())).toBe(true);
    expect(policy.endsTheRun(reloaded)).toBe(true);
    expect(policy.endsTheRun(new Error("x"))).toBe(false);
  });
});
