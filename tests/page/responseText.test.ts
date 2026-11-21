import { parseResponse } from "../../src/page/responseText";

describe("parseResponse", () => {
  it("drops the guard prefix and reads one document per line", () => {
    expect(parseResponse('for (;;);{"a":1}\n{"b":2}\nnot json')).toEqual([
      { a: 1 },
      { b: 2 },
    ]);
  });
});
