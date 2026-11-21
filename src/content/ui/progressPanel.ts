import { describeWait } from "../pacing/pacing";
import { createTextButton } from "./buttons";
import { bySelector, CLASS } from "./classNames";
import { FULL_PERCENT, NO_PERCENT, percentText } from "./percent";
import type { Countdown } from "./countdown";

export interface RunReporter {
  heading(text: string): void;
  detail(text: string): void;
  waiting(reason: string, ms: number): void;
  /** Where a run over many accounts has got to, as words and a fraction done. */
  overall(text: string, fraction: number): void;
  /** How far through the current account, or undefined to hide the bar. */
  accountBar(fraction: number | undefined): void;
}

export interface RunPanel extends RunReporter {
  open(title: string, onStop: () => void): void;
  finish(message: string): void;
}

// Top to bottom. Bars stay hidden until something reports a fraction.
const parts = [
  "title",
  "overall",
  "overall-bar",
  "heading",
  "detail",
  "account-bar",
  "note",
] as const;
type Part = (typeof parts)[number];
const barSuffix = "-bar";
const isBar = (part: Part): boolean => part.endsWith(barSuffix);
const partClass = (part: Part): string => `${CLASS.panelPartPrefix}${part}`;

const text = {
  note: "Keep this tab open while it runs.",
  stop: "Stop",
  close: "Close",
} as const;

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
    panel.className = CLASS.panel;
    for (const part of parts) panel.append(this.line(part));
    this.set("title", title, panel);
    this.set("note", text.note, panel);
    panel.append(
      createTextButton(this.document, {
        label: text.stop,
        className: CLASS.panelButton,
        onClick: onStop,
      }),
    );
    this.document.body.append(panel);
    this.element = panel;
  }

  private line(part: Part): HTMLElement {
    const line = this.document.createElement("div");
    line.className = partClass(part);
    if (!isBar(part)) return line;
    line.hidden = true;
    line.setAttribute("role", "progressbar");
    line.setAttribute("aria-valuemin", String(NO_PERCENT));
    line.setAttribute("aria-valuemax", String(FULL_PERCENT));
    line.append(this.document.createElement("div"));
    return line;
  }

  private find(part: Part, panel = this.element): HTMLElement | null {
    return (
      panel?.querySelector<HTMLElement>(bySelector(partClass(part))) ?? null
    );
  }

  private set(part: Part, text: string, panel = this.element): void {
    const line = this.find(part, panel);
    if (line) line.textContent = text;
  }

  private bar(part: Part, fraction: number | undefined): void {
    const bar = this.find(part);
    if (!bar) return;
    bar.hidden = fraction === undefined;
    const value = Math.round((fraction ?? 0) * FULL_PERCENT);
    bar.setAttribute("aria-valuenow", String(value));
    const fill = bar.firstElementChild as HTMLElement;
    fill.style.width = percentText(value);
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

  overall(text: string, fraction: number): void {
    this.set("overall", text);
    this.bar("overall-bar", fraction);
  }

  accountBar(fraction: number | undefined): void {
    this.bar("account-bar", fraction);
  }

  finish(message: string): void {
    this.detail(message);
    const panel = this.element;
    panel?.querySelector(bySelector(CLASS.panelButton))?.replaceWith(
      createTextButton(this.document, {
        label: text.close,
        className: CLASS.panelButton,
        onClick: () => {
          panel.remove();
        },
      }),
    );
  }
}
