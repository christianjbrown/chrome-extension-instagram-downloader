import {
  callMember,
  idAnswer,
  methodOf,
  textAnswer,
} from "../../src/page/members";

describe("methodOf", () => {
  it("gives back a member that is a function", () => {
    const run = () => 1;
    expect(methodOf({ run }, "run")).toBe(run);
  });

  it("fails when the member is missing or not a function", () => {
    expect(() => methodOf({ run: 1 }, "run")).toThrow("run is not available");
    expect(() => methodOf(undefined, "run")).toThrow("run is not available");
  });
});

it("calls a member on the object it belongs to", () => {
  const module = {
    factor: 2,
    times(n: unknown) {
      return this.factor * Number(n);
    },
  };
  expect(callMember(module, "times", 3)).toBe(6);
});

describe("textAnswer", () => {
  it("passes text and turns anything else down", () => {
    expect(textAnswer("a", "getA")).toBe("a");
    expect(() => textAnswer(1, "getA")).toThrow(
      "getA sent an unexpected answer",
    );
  });
});

describe("idAnswer", () => {
  it("passes text and numbers as text and turns anything else down", () => {
    expect(idAnswer("7", "getId")).toBe("7");
    expect(idAnswer(7, "getId")).toBe("7");
    expect(() => idAnswer(null, "getId")).toThrow(
      "getId sent an unexpected answer",
    );
  });
});
