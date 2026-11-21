import { TAGS } from "../../shared/dom";
import { describeWait } from "../pacing/waitText";
import { bySelector, CLASS } from "./classNames";
import type { TextButtons, Countdown, ProgressBars, RunPanel } from "./ports";

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
    private readonly buttons: TextButtons,
    private readonly bars: ProgressBars,
  ) {}

  open(title: string, onStop: () => void): void {
    this.stopCountdown();
    this.element?.remove();
    const panel = this.document.createElement(TAGS.div);
    panel.className = CLASS.panel;
    for (const part of parts) panel.append(this.line(part));
    this.set("title", title, panel);
    this.set("note", text.note, panel);
    panel.append(
      this.buttons.textButton({
        label: text.stop,
        className: CLASS.panelButton,
        onClick: onStop,
      }),
    );
    this.document.body.append(panel);
    this.element = panel;
  }

  private line(part: Part): HTMLElement {
    if (isBar(part)) return this.bars.create(partClass(part));
    const line = this.document.createElement(TAGS.div);
    line.className = partClass(part);
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
    if (bar) this.bars.show(bar, fraction);
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
      this.buttons.textButton({
        label: text.close,
        className: CLASS.panelButton,
        onClick: () => {
          panel.remove();
        },
      }),
    );
  }
}
