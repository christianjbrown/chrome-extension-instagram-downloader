import {
  createButton,
  createTextButton,
  textButtonClass,
} from "../../../src/content/ui/buttons";
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

  it("shows progress, stops, and closes when finished", () => {
    const panel = new ProgressPanel(document);
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
