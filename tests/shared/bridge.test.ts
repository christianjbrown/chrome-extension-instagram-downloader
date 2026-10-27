import { isBridgeRequest } from "../../src/shared/bridge";

describe("isBridgeRequest", () => {
  it("accepts a request naming a procedure", () => {
    expect(isBridgeRequest({ igdlProcedure: "viewer", input: {} })).toBe(true);
  });

  it.each([null, "viewer", 3, {}, { igdlProcedure: 1 }])(
    "rejects %j",
    (value) => {
      expect(isBridgeRequest(value)).toBe(false);
    },
  );
});
