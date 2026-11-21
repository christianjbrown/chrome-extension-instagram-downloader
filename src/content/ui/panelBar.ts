// A bar on the progress panel showing how much of something is done, hidden
// until that is known. Before a panel is up there is no bar to fill.
import { ATTRIBUTES, TAGS } from "../../shared/dom";
import { FULL_PERCENT, NO_PERCENT, percentText } from "./percent";
import type { PanelBar, PanelPart } from "./ports";

const progressRole = "progressbar";

interface BarElements {
  readonly bar: HTMLElement;
  readonly fill: HTMLElement;
}

export class DomPanelBar implements PanelPart, PanelBar {
  private elements: BarElements | undefined;

  constructor(
    private readonly document: Document,
    private readonly className: string,
  ) {}

  create(): HTMLElement {
    const bar = this.document.createElement(TAGS.div);
    bar.className = this.className;
    bar.hidden = true;
    bar.setAttribute(ATTRIBUTES.role, progressRole);
    bar.setAttribute(ATTRIBUTES.ariaValueMin, String(NO_PERCENT));
    bar.setAttribute(ATTRIBUTES.ariaValueMax, String(FULL_PERCENT));
    const fill = this.document.createElement(TAGS.div);
    bar.append(fill);
    this.elements = { bar, fill };
    return bar;
  }

  fill(fraction: number | undefined): void {
    if (this.elements) this.show(this.elements, fraction);
  }

  private show({ bar, fill }: BarElements, fraction: number | undefined): void {
    bar.hidden = fraction === undefined;
    const value = Math.round((fraction ?? 0) * FULL_PERCENT);
    bar.setAttribute(ATTRIBUTES.ariaValueNow, String(value));
    fill.style.width = percentText(value);
  }
}
