// A bar showing how much of something is done, hidden until that is known.
import { ATTRIBUTES, TAGS } from "../../shared/dom";
import { FULL_PERCENT, NO_PERCENT, percentText } from "./percent";

const progressRole = "progressbar";

export function createProgressBar(
  document: Document,
  className: string,
): HTMLElement {
  const bar = document.createElement(TAGS.div);
  bar.className = className;
  bar.hidden = true;
  bar.setAttribute(ATTRIBUTES.role, progressRole);
  bar.setAttribute(ATTRIBUTES.ariaValueMin, String(NO_PERCENT));
  bar.setAttribute(ATTRIBUTES.ariaValueMax, String(FULL_PERCENT));
  bar.append(document.createElement(TAGS.div));
  return bar;
}

/** Fills the bar to the fraction done, or hides it when that is unknown. */
export function showProgress(
  bar: HTMLElement,
  fraction: number | undefined,
): void {
  bar.hidden = fraction === undefined;
  const value = Math.round((fraction ?? 0) * FULL_PERCENT);
  bar.setAttribute(ATTRIBUTES.ariaValueNow, String(value));
  const fill = bar.firstElementChild as HTMLElement;
  fill.style.width = percentText(value);
}
