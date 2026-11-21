import { ConsecutiveFailureTally } from "../../../src/content/bulk/failureTally";
import {
  AnyStopPolicy,
  ReloadedExtensionPolicy,
  StopOrBlockPolicy,
} from "../../../src/content/bulk/stopPolicies";
import { BlockedError, abortError } from "../../../src/content/errors";
import { errorText } from "../helpers";

const stops = new AnyStopPolicy([
  new StopOrBlockPolicy(),
  new ReloadedExtensionPolicy(),
]);

describe("ConsecutiveFailureTally", () => {
  it("says nothing when every account was read", () => {
    expect(new ConsecutiveFailureTally(2, stops, errorText()).summary()).toBe(
      "",
    );
  });

  it("names the accounts that failed", () => {
    const tally = new ConsecutiveFailureTally(2, stops, errorText());
    tally.failed("a", new Error("x"));
    tally.succeeded();
    tally.failed("b", "plain");
    expect(tally.summary()).toBe(" Could not read 2: a, b.");
  });

  it("starts afresh after a reset", () => {
    const tally = new ConsecutiveFailureTally(2, stops, errorText());
    tally.failed("a", new Error("x"));
    tally.reset();
    tally.failed("b", new Error("x"));
    expect(tally.summary()).toBe(" Could not read 1: b.");
  });

  it("gives up with the real reason once enough fail in a row", () => {
    const tally = new ConsecutiveFailureTally(2, stops, errorText());
    tally.failed("a", new Error("x"));
    expect(() => {
      tally.failed("b", new Error("Account not found"));
    }).toThrow(
      new BlockedError(
        "Stopped after 2 accounts in a row failed. The last, b, failed with: Account not found",
      ),
    );
  });

  it.each([
    abortError(),
    new BlockedError("Try again tomorrow."),
    new Error("Extension context invalidated."),
  ])("lets %o end the run", (error) => {
    expect(() => {
      new ConsecutiveFailureTally(5, stops, errorText()).failed("a", error);
    }).toThrow(error);
  });
});
