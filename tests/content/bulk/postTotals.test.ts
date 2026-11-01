import { GatedPostTotals } from "../../../src/content/bulk/postTotals";
import { BlockedError, abortError } from "../../../src/content/errors";
import { photo } from "../../fixtures";
import { fakeBridge, reporter, signal } from "../helpers";

const page = { items: [photo("1")], cursor: undefined };

function setup(account: () => Promise<unknown>) {
  const bridge = fakeBridge({ account: account as never });
  const gate = { call: vi.fn((request: () => Promise<unknown>) => request()) };
  return { bridge, gate, totals: new GatedPostTotals(bridge, gate as never) };
}

const find = (totals: GatedPostTotals, first = page as never) =>
  totals.find("alice", first, signal(), reporter());

describe("GatedPostTotals", () => {
  it("uses the page's total without a request when it has one", async () => {
    const { totals, gate } = setup(() => Promise.reject(new Error("unused")));
    await expect(find(totals, { ...page, total: 40 } as never)).resolves.toBe(
      40,
    );
    expect(gate.call).not.toHaveBeenCalled();
  });

  it("does not ask about an account with no posts", async () => {
    const { totals, gate } = setup(() => Promise.reject(new Error("unused")));
    await expect(
      find(totals, { items: [], cursor: undefined } as never),
    ).resolves.toBeUndefined();
    expect(gate.call).not.toHaveBeenCalled();
  });

  it("asks for the profile through the gate otherwise", async () => {
    const { totals, gate, bridge } = setup(() =>
      Promise.resolve({ totalPosts: 948 }),
    );
    await expect(find(totals)).resolves.toBe(948);
    expect(gate.call).toHaveBeenCalledTimes(1);
    expect(bridge.call).toHaveBeenCalledWith("account", { username: "alice" });
  });

  it("treats a zero count as unknown", async () => {
    const { totals } = setup(() => Promise.resolve({ totalPosts: 0 }));
    await expect(find(totals)).resolves.toBeUndefined();
  });

  it("shrugs off a failed lookup but not a stop or a block", async () => {
    await expect(
      find(setup(() => Promise.reject(new Error("Account not found"))).totals),
    ).resolves.toBeUndefined();
    await expect(
      find(setup(() => Promise.reject(abortError())).totals),
    ).rejects.toMatchObject({ name: "AbortError" });
    await expect(
      find(setup(() => Promise.reject(new BlockedError("no"))).totals),
    ).rejects.toBeInstanceOf(BlockedError);
  });
});
