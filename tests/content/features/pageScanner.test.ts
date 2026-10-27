import { PageScanner } from "../../../src/content/features/pageScanner";

it("scans at once, then once more shortly after the page changes", () => {
  vi.useFakeTimers();
  const feature = { scan: vi.fn() };
  const broken = {
    scan: vi.fn(() => {
      throw new Error("unexpected page");
    }),
  };
  let onChange: () => void = () => undefined;
  const observe = vi.fn();
  new PageScanner([broken, feature], 100).start(document.body, (callback) => {
    onChange = callback;
    return { observe } as unknown as MutationObserver;
  });
  expect(feature.scan).toHaveBeenCalledTimes(1);
  expect(observe).toHaveBeenCalledWith(document.body, {
    childList: true,
    subtree: true,
  });
  onChange();
  onChange();
  vi.advanceTimersByTime(100);
  expect(feature.scan).toHaveBeenCalledTimes(2);
  onChange();
  vi.advanceTimersByTime(100);
  expect(feature.scan).toHaveBeenCalledTimes(3);
  vi.useRealTimers();
});
