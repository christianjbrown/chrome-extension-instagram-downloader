// What the content script shows on the page, as its callers see it.

export interface Countdown {
  /** Calls show with the time left now and as each second passes, down to zero. The returned function stops it. */
  start(ms: number, show: (remainingMs: number) => void): () => void;
}

export interface Notifier {
  error(message: string): void;
}

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
