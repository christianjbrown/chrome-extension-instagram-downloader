// A bar showing how much of something is done, hidden until that is known.
import { ATTRIBUTES, TAGS } from "../../shared/dom";
import { FULL_PERCENT, NO_PERCENT, percentText } from "./percent";
import type { ProgressBars } from "./ports";

const progressRole = "progressbar";

export class DomProgressBars implements ProgressBars {
  constructor(private readonly document: Document) {}

  create(className: string): HTMLElement {
    const bar = this.document.createElement(TAGS.div);
    bar.className = className;
    bar.hidden = true;
    bar.setAttribute(ATTRIBUTES.role, progressRole);
    bar.setAttribute(ATTRIBUTES.ariaValueMin, String(NO_PERCENT));
    bar.setAttribute(ATTRIBUTES.ariaValueMax, String(FULL_PERCENT));
    bar.append(this.document.createElement(TAGS.div));
    return bar;
  }

  show(bar: HTMLElement, fraction: number | undefined): void {
    bar.hidden = fraction === undefined;
    const value = Math.round((fraction ?? 0) * FULL_PERCENT);
    bar.setAttribute(ATTRIBUTES.ariaValueNow, String(value));
    const fill = bar.firstElementChild as HTMLElement;
    fill.style.width = percentText(value);
  }
}
