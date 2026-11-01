import { describeWait } from "../pacing/pacing";
import { createTextButton } from "./buttons";
import type { Countdown } from "./countdown";

export interface RunReporter {
  heading(text: string): void;
  detail(text: string): void;
  waiting(reason: string, ms: number): void;
}

export interface RunPanel extends RunReporter {
  open(title: string, onStop: () => void): void;
  finish(message: string): void;
}

// A fixed panel showing what a bulk download is doing, with a Stop button.
export class ProgressPanel implements RunPanel {
  private element: HTMLElement | undefined;
  private stopCountdown = (): void => undefined;

  constructor(
    private readonly document: Document,
    private readonly countdown: Countdown,
  ) {}

  open(title: string, onStop: () => void): void {
    this.stopCountdown();
    this.element?.remove();
    const panel = this.document.createElement("div");
    panel.className = "igdl-panel";
    for (const part of ["title", "heading", "detail", "note"]) {
      const line = this.document.createElement("div");
      line.className = `igdl-panel-${part}`;
      panel.append(line);
    }
    this.set("title", title, panel);
    this.set("note", "Keep this tab open while it runs.", panel);
    panel.append(
      createTextButton(this.document, {
        label: "Stop",
        className: "igdl-panel-button",
        onClick: onStop,
      }),
    );
    this.document.body.append(panel);
    this.element = panel;
  }

  private set(part: string, text: string, panel = this.element): void {
    const line = panel?.querySelector(`.igdl-panel-${part}`);
    if (line) line.textContent = text;
  }

  heading(text: string): void {
    this.set("heading", text);
  }

  detail(text: string): void {
    this.stopCountdown();
    this.set("detail", text);
  }

  // Counts down until the wait is over or other news replaces it.
  waiting(reason: string, ms: number): void {
    this.stopCountdown();
    this.stopCountdown = this.countdown.start(ms, (remaining) => {
      this.set("detail", describeWait(reason, remaining));
    });
  }

  finish(message: string): void {
    this.detail(message);
    const panel = this.element;
    panel?.querySelector(".igdl-panel-button")?.replaceWith(
      createTextButton(this.document, {
        label: "Close",
        className: "igdl-panel-button",
        onClick: () => {
          panel.remove();
        },
      }),
    );
  }
}
