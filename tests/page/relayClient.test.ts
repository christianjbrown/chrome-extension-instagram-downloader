import {
  RelayClient,
  isJsonObject,
  windowRequire,
} from "../../src/page/relayClient";

describe("windowRequire", () => {
  it("fails until Instagram's loader exists", () => {
    expect(() => windowRequire({})("X")).toThrow(
      "Instagram has not finished loading",
    );
  });

  it("asks Instagram's loader for the module", () => {
    const require = vi.fn(() => "module");
    expect(windowRequire({ require })("X")).toBe("module");
    expect(require).toHaveBeenCalledWith("X");
  });
});

it("isJsonObject accepts objects only", () => {
  expect(isJsonObject({})).toBe(true);
  expect(isJsonObject(null)).toBe(false);
});

function environment(responses: { data?: unknown }[], error?: unknown) {
  const execute = vi.fn(() => ({
    subscribe: (observer: {
      next(r: { data?: unknown }): void;
      error(e: unknown): void;
      complete(): void;
    }) => {
      for (const response of responses) observer.next(response);
      if (error === undefined) observer.complete();
      else observer.error(error);
    },
  }));
  return { getNetwork: () => ({ execute }), execute };
}

describe("RelayClient", () => {
  it("finds a query module, or a query inside one", () => {
    const query = { params: { id: 1 } };
    const modules: Record<string, unknown> = {
      Direct: query,
      Holder: { MEMBER: query },
      Fn: () => query,
      Bad: {},
    };
    const client = new RelayClient((name) => modules[name]);
    expect(client.query("Direct")).toBe(query);
    expect(client.query("Holder", "MEMBER")).toBe(query);
    expect(() => client.query("Fn", "MEMBER")).toThrow("Fn is not available");
    expect(() => client.query("Bad")).toThrow("Bad is not available");
  });

  it("returns the first response carrying data", async () => {
    const env = environment([{}, { data: { a: 1 } }]);
    const client = new RelayClient(() => env);
    await expect(client.run({ params: "p" }, { v: 1 })).resolves.toEqual({
      a: 1,
    });
    expect(env.execute).toHaveBeenCalledWith("p", { v: 1 }, { force: true });
  });

  it("fails when no response carries data, or the network fails", async () => {
    await expect(
      new RelayClient(() => environment([{}])).run({ params: 1 }, {}),
    ).rejects.toThrow("Instagram sent no data");
    const failure = new Error("offline");
    await expect(
      new RelayClient(() => environment([], failure)).run({ params: 1 }, {}),
    ).rejects.toBe(failure);
  });
});
