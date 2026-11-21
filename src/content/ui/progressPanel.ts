import type {
  PanelBar,
  PanelLine,
  PanelView,
  PanelWording,
  RunPanel,
  WaitLine,
} from "./ports";

/** The lines and bars a run's progress is written into. */
export interface PanelLines {
  readonly title: PanelLine;
  readonly overall: PanelLine;
  readonly overallBar: PanelBar;
  readonly heading: PanelLine;
  readonly detail: PanelLine;
  readonly accountBar: PanelBar;
  readonly note: PanelLine;
}

// What a bulk download reports, shown on the panel. Building the panel, its
// words and the countdown of a wait are each their own part.
export class ProgressPanel implements RunPanel {
  constructor(
    private readonly view: PanelView,
    private readonly lines: PanelLines,
    private readonly waits: WaitLine,
    private readonly wording: PanelWording,
  ) {}

  open(title: string, onStop: () => void): void {
    this.waits.stop();
    this.view.show(this.wording.stop, onStop);
    this.lines.title.write(title);
    this.lines.note.write(this.wording.note);
  }

  heading(text: string): void {
    this.lines.heading.write(text);
  }

  detail(text: string): void {
    this.waits.stop();
    this.lines.detail.write(text);
  }

  // Counts down until the wait is over or other news replaces it.
  waiting(reason: string, ms: number): void {
    this.waits.start(reason, ms, (text) => {
      this.lines.detail.write(text);
    });
  }

  overall(text: string, fraction: number): void {
    this.lines.overall.write(text);
    this.lines.overallBar.fill(fraction);
  }

  accountBar(fraction: number | undefined): void {
    this.lines.accountBar.fill(fraction);
  }

  finish(message: string): void {
    this.detail(message);
    this.view.offerClose(this.wording.close);
  }
}
