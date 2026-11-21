import { PROCEDURE_OUTPUTS } from "../../src/content/procedureWiring";
import { ValidatedBridge } from "../../src/content/validatedBridge";
import { fakeBridge } from "./helpers";

describe("ValidatedBridge", () => {
  it("passes a well-formed answer through", async () => {
    const bridge = new ValidatedBridge(
      fakeBridge({ viewer: () => ({ id: "1", username: "me" }) }),
      PROCEDURE_OUTPUTS,
    );
    await expect(bridge.call("viewer", {})).resolves.toEqual({
      id: "1",
      username: "me",
    });
  });

  it("rejects an answer of the wrong shape", async () => {
    const bridge = new ValidatedBridge(
      fakeBridge({ viewer: () => ({ id: 1 }) as never }),
      PROCEDURE_OUTPUTS,
    );
    await expect(bridge.call("viewer", {})).rejects.toThrow("unexpected");
  });
});
