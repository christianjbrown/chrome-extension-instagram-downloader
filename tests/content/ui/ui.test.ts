import {
  createButton,
  createTextButton,
} from "../../../src/content/ui/buttons";
import { ToastNotifier } from "../../../src/content/ui/notifier";
import { ProgressPanel } from "../../../src/content/ui/progressPanel";

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

describe("ToastNotifier", () => {
  it("shows an error, then removes it", () => {
    vi.useFakeTimers();
    new ToastNotifier(document, 100).error("Nope");
    expect(document.querySelector(".igdl-toast")?.textContent).toBe("Nope");
    vi.advanceTimersByTime(100);
    expect(document.querySelector(".igdl-toast")).toBeNull();
    vi.useRealTimers();
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
