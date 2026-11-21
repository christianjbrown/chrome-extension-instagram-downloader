// What the content script shows on the page, as its callers see it.
import type { WaitReporter } from "../pacing/pacing";

export interface Countdown {
  /** Calls show with the time left now and as each second passes, down to zero. The returned function stops it. */
  start(ms: number, show: (remainingMs: number) => void): () => void;
}

export interface Notifier {
  error(message: string): void;
}

/** Names what a run is working on now. */
export interface HeadingReporter {
  heading(text: string): void;
}

/** One line on how the current step is going. */
export interface DetailReporter {
  detail(text: string): void;
}

export interface AccountProgress {
  /** How far through the current account, or undefined to hide the bar. */
  accountBar(fraction: number | undefined): void;
}

interface OverallProgress {
  /** Where a run over many accounts has got to, as words and a fraction done. */
  overall(text: string, fraction: number): void;
}

/** Everything a bulk run can report, for the parts that hand it on. */
export interface RunReporter
  extends
    HeadingReporter,
    DetailReporter,
    WaitReporter,
    AccountProgress,
    OverallProgress {}

export interface RunPanel extends RunReporter {
  open(title: string, onStop: () => void): void;
  finish(message: string): void;
}

export interface ButtonSpec {
  readonly label: string;
  readonly className: string;
  readonly onClick: () => void;
}

/** Makes the icon buttons, labelled for screen readers and on hover. */
export interface IconButtons {
  button(spec: ButtonSpec): HTMLButtonElement;
}

/** Makes the buttons that show their label as text. */
export interface TextButtons {
  textButton(spec: ButtonSpec): HTMLButtonElement;
}

/** One line or bar of the progress panel, which makes its own element. */
export interface PanelPart {
  create(): HTMLElement;
}

/** A line of the panel, written when a panel is up. */
export interface PanelLine {
  write(text: string): void;
}

/** A bar of the panel, filled when a panel is up. */
export interface PanelBar {
  /** Fills the bar to the fraction done, or hides it when that is unknown. */
  fill(fraction: number | undefined): void;
}

/** The progress panel on the page: its parts and its one button. */
export interface PanelView {
  /** Puts up a new panel in place of any other, its button stopping the run. */
  show(stopLabel: string, onStop: () => void): void;
  /** Turns the button into one that takes the panel away. */
  offerClose(closeLabel: string): void;
}

/** The words on the progress panel itself and its one button. */
export interface PanelLabels {
  readonly note: string;
  readonly stop: string;
  readonly close: string;
}

/** How the progress panel words a wait as it counts down. */
export interface WaitWording {
  wait(reason: string, remainingMs: number): string;
}

/** Shows a wait as it counts down, until it ends or is stopped. */
export interface WaitLine {
  /** Writes the wait each second, in place of any wait already showing. */
  start(reason: string, ms: number, write: (text: string) => void): void;
  stop(): void;
}
