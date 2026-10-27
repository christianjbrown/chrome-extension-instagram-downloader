const startContent = vi.fn();
vi.mock("../../src/content/startContent", () => ({ startContent }));

it("starts the content script with the window and extension storage", async () => {
  const local = { get: vi.fn(), set: vi.fn() };
  vi.stubGlobal("chrome", { storage: { local } });
  await import("../../src/content/main");
  expect(startContent).toHaveBeenCalledWith({ window, storage: local });
  vi.unstubAllGlobals();
});
