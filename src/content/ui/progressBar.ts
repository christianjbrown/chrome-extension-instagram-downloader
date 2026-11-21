// A bar showing how much of something is done, hidden until that is known.
import { FULL_PERCENT, NO_PERCENT, percentText } from "./percent";

const progressRole = "progressbar";

export function createProgressBar(
  document: Document,
  className: string,
): HTMLElement {
  const bar = document.createElement("div");
  bar.className = className;
  bar.hidden = true;
  bar.setAttribute("role", progressRole);
  bar.setAttribute("aria-valuemin", String(NO_PERCENT));
  bar.setAttribute("aria-valuemax", String(FULL_PERCENT));
  bar.append(document.createElement("div"));
  return bar;
}

/** Fills the bar to the fraction done, or hides it when that is unknown. */
export function showProgress(
  bar: HTMLElement,
  fraction: number | undefined,
): void {
  bar.hidden = fraction === undefined;
  const value = Math.round((fraction ?? 0) * FULL_PERCENT);
  bar.setAttribute("aria-valuenow", String(value));
  const fill = bar.firstElementChild as HTMLElement;
  fill.style.width = percentText(value);
}
