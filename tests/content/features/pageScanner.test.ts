import { ManualScheduler } from "../helpers";
import { PageScanner } from "../../../src/content/features/pageScanner";

it("scans at once, then once more shortly after the page changes", () => {
  const scheduler = new ManualScheduler();
  const feature = { scan: vi.fn() };
  const broken = {
    scan: vi.fn(() => {
      throw new Error("unexpected page");
    }),
  };
  let onChange: () => void = () => undefined;
  const observe = vi.fn();
  new PageScanner([broken, feature], scheduler, 100).start(
    document.body,
    (callback) => {
      onChange = callback;
      return { observe } as unknown as MutationObserver;
    },
  );
  expect(feature.scan).toHaveBeenCalledTimes(1);
  expect(observe).toHaveBeenCalledWith(document.body, {
    childList: true,
    subtree: true,
  });
  onChange();
  onChange();
  expect(scheduler.pending.size).toBe(1);
  scheduler.runAll();
  expect(feature.scan).toHaveBeenCalledTimes(2);
  onChange();
  scheduler.runAll();
  expect(feature.scan).toHaveBeenCalledTimes(3);
});
