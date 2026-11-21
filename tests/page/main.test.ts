import { PAGE_CONFIG } from "../../src/page/config";

const startPage = vi.fn();
vi.mock("../../src/page/startPage", () => ({ startPage }));

it("starts the page script on the real window with its settings", async () => {
  await import("../../src/page/main");
  expect(startPage).toHaveBeenCalledWith(window, PAGE_CONFIG);
});
