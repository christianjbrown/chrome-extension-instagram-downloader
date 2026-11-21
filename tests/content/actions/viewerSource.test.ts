import { ViewerSource } from "../../../src/content/actions/viewerSource";
import { fakeBridge } from "../helpers";

describe("ViewerSource", () => {
  it("looks the account up once", async () => {
    const bridge = fakeBridge({ viewer: () => ({ id: "1", username: "me" }) });
    const source = new ViewerSource(bridge, () => 0, 60_000);
    await source.current();
    await expect(source.current()).resolves.toEqual({
      id: "1",
      username: "me",
    });
    expect(bridge.call).toHaveBeenCalledTimes(1);
  });

  it("waits a minute before retrying a failed lookup", async () => {
    let now = 0;
    const bridge = fakeBridge({});
    const source = new ViewerSource(bridge, () => now, 60_000);
    await expect(source.current()).resolves.toBeUndefined();
    now = 59_000;
    await source.current();
    expect(bridge.call).toHaveBeenCalledTimes(1);
    now = 61_000;
    await source.current();
    expect(bridge.call).toHaveBeenCalledTimes(2);
  });
});
