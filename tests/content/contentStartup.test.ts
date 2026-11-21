import { ContentStartup } from "../../src/content/contentStartup";

it("tidies up after earlier versions before it watches the page", () => {
  const order: string[] = [];
  const tidy = { run: vi.fn(() => order.push("tidy")) };
  const watcher = { start: vi.fn(() => order.push("watch")) };
  const createObserver = vi.fn();
  new ContentStartup([tidy], watcher).start(document.body, createObserver);
  expect(order).toEqual(["tidy", "watch"]);
  expect(watcher.start).toHaveBeenCalledWith(document.body, createObserver);
});
