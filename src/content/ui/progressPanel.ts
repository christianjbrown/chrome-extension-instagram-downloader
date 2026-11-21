import type { PanelView, PanelWording, RunPanel, WaitLine } from "./ports";

// What a bulk download reports, shown on the panel. Building the panel, its
// words and the countdown of a wait are each their own part.
export class ProgressPanel implements RunPanel {
  constructor(
    private readonly view: PanelView,
    private readonly waits: WaitLine,
    private readonly wording: PanelWording,
  ) {}

  open(title: string, onStop: () => void): void {
    this.waits.stop();
    this.view.show(this.wording.stop, onStop);
    this.view.line("title", title);
    this.view.line("note", this.wording.note);
  }

  heading(text: string): void {
    this.view.line("heading", text);
  }

  detail(text: string): void {
    this.waits.stop();
    this.view.line("detail", text);
  }

  // Counts down until the wait is over or other news replaces it.
  waiting(reason: string, ms: number): void {
    this.waits.start(reason, ms, (text) => {
      this.view.line("detail", text);
    });
  }

  overall(text: string, fraction: number): void {
    this.view.line("overall", text);
    this.view.bar("overall-bar", fraction);
  }

  accountBar(fraction: number | undefined): void {
    this.view.bar("account-bar", fraction);
  }

  finish(message: string): void {
    this.detail(message);
    this.view.offerClose(this.wording.close);
  }
}
