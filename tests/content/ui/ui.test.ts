import {
  createButton,
  createTextButton,
  textButtonClass,
} from "../../../src/content/ui/buttons";
import { SecondCountdown } from "../../../src/content/ui/countdown";
import { ToastNotifier } from "../../../src/content/ui/notifier";
import { ProgressPanel } from "../../../src/content/ui/progressPanel";
import { ManualScheduler } from "../helpers";

describe("buttons", () => {
  it("runs its action without letting the click reach the page", () => {
    const onClick = vi.fn();
    const outer = vi.fn();
    const button = createButton(document, {
      label: "Save",
      className: "b",
      onClick,
    });
    document.body.append(button);
    document.body.addEventListener("click", outer);
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    button.dispatchEvent(click);
    expect(onClick).toHaveBeenCalled();
    expect(outer).not.toHaveBeenCalled();
    expect(click.defaultPrevented).toBe(true);
    expect(button.getAttribute("aria-label")).toBe("Save");
    expect(
      createTextButton(document, { label: "Go", className: "b", onClick })
        .textContent,
    ).toBe("Go");
  });
});

describe("textButtonClass", () => {
  it("names the shared look and one icon", () => {
    expect(textButtonClass("folder")).toBe("igdl-text-button igdl-icon-folder");
    expect(textButtonClass("download-all")).toBe(
      "igdl-text-button igdl-icon-download-all",
    );
  });
});

describe("ToastNotifier", () => {
  it("shows an error, then removes it", () => {
    const scheduler = new ManualScheduler();
    new ToastNotifier(document, scheduler, 100).error("Nope");
    expect(document.querySelector(".igdl-toast")?.textContent).toBe("Nope");
    expect([...scheduler.pending.values()][0]?.ms).toBe(100);
    scheduler.runAll();
    expect(document.querySelector(".igdl-toast")).toBeNull();
  });
});

describe("ProgressPanel", () => {
  const text = (part: string) =>
    document.querySelector(`.igdl-panel-${part}`)?.textContent;

  const stillCountdown = {
    start: (ms: number, show: (left: number) => void) => (show(ms), vi.fn()),
  };

  it("shows progress, stops, and closes when finished", () => {
    const panel = new ProgressPanel(document, stillCountdown);
    panel.heading("ignored before opening");
    panel.finish("ignored before opening");
    const onStop = vi.fn();
    panel.open("Old", vi.fn());
    panel.open("Downloading", onStop);
    expect(document.querySelectorAll(".igdl-panel")).toHaveLength(1);
    panel.heading("alice");
    panel.waiting("Slow down", 60_000);
    expect(text("title")).toBe("Downloading");
    expect(text("heading")).toBe("alice");
    expect(text("detail")).toBe("Slow down. Waiting 1 minute.");
    document.querySelector<HTMLButtonElement>(".igdl-panel-button")?.click();
    expect(onStop).toHaveBeenCalled();
    panel.finish("Done");
    expect(text("detail")).toBe("Done");
    const close =
      document.querySelector<HTMLButtonElement>(".igdl-panel-button");
    expect(close?.textContent).toBe("Close");
    close?.click();
    expect(document.querySelector(".igdl-panel")).toBeNull();
  });
});

describe("ProgressPanel countdown", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  const detail = () =>
    document.querySelector(".igdl-panel-detail")?.textContent;

  it("counts a wait down, and stops when other news replaces it", () => {
    let clock = 0;
    const scheduler = new ManualScheduler();
    const panel = new ProgressPanel(
      document,
      new SecondCountdown(scheduler, () => clock),
    );
    panel.open("Downloading", vi.fn());
    panel.waiting("Resting", 61_500);
    expect(detail()).toBe("Resting. Waiting 1 minute 2 seconds.");
    clock = 500;
    scheduler.runAll();
    expect(detail()).toBe("Resting. Waiting 1 minute 1 second.");
    panel.detail("alice: 3 of 9");
    expect(scheduler.pending.size).toBe(0);
    expect(detail()).toBe("alice: 3 of 9");
  });

  it("replaces an earlier wait and stops at zero", () => {
    let clock = 0;
    const scheduler = new ManualScheduler();
    const panel = new ProgressPanel(
      document,
      new SecondCountdown(scheduler, () => clock),
    );
    panel.open("Downloading", vi.fn());
    panel.waiting("Resting", 5000);
    panel.waiting("Slow down", 1000);
    expect(scheduler.pending.size).toBe(1);
    expect(detail()).toBe("Slow down. Waiting 1 second.");
    clock = 1000;
    scheduler.runAll();
    expect(detail()).toBe("Slow down. Waiting 0 seconds.");
    expect(scheduler.pending.size).toBe(0);
  });
});
