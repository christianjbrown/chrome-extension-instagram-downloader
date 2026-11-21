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

/** Makes bars showing how much of something is done. */
export interface ProgressBars {
  /** A bar, hidden until it is shown a fraction. */
  create(className: string): HTMLElement;
  /** Fills the bar to the fraction done, or hides it when that is unknown. */
  show(bar: HTMLElement, fraction: number | undefined): void;
}
