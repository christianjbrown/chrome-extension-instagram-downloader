const startPage = vi.fn();
vi.mock("../../src/page/startPage", () => ({ startPage }));

it("starts the page script on the real window", async () => {
  await import("../../src/page/main");
  expect(startPage).toHaveBeenCalledWith(window);
});
