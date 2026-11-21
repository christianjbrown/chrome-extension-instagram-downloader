import { CONTENT_CONFIG } from "../../src/content/config";

const startContent = vi.fn();
vi.mock("../../src/content/startContent", () => ({ startContent }));

it("starts the content script with the window, extension storage and its settings", async () => {
  const local = { get: vi.fn(), set: vi.fn() };
  vi.stubGlobal("chrome", { storage: { local } });
  await import("../../src/content/main");
  expect(startContent).toHaveBeenCalledWith(
    { window, storage: local },
    CONTENT_CONFIG,
  );
  vi.unstubAllGlobals();
});
