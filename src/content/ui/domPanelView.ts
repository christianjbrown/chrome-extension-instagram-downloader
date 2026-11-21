import { TAGS } from "../../shared/dom";
import { bySelector, CLASS } from "./classNames";
import { isBar, PANEL_PARTS, partClass, type PanelPart } from "./panelParts";
import type { PanelView, ProgressBars, TextButtons } from "./ports";

// Builds the fixed panel on the page and writes into it. Before a panel is up
// there is nothing to write into, so lines and bars are left alone.
export class DomPanelView implements PanelView {
  private element: HTMLElement | undefined;

  constructor(
    private readonly document: Document,
    private readonly buttons: TextButtons,
    private readonly bars: ProgressBars,
  ) {}

  show(stopLabel: string, onStop: () => void): void {
    this.element?.remove();
    const panel = this.build(stopLabel, onStop);
    this.document.body.append(panel);
    this.element = panel;
  }

  line(part: PanelPart, text: string): void {
    this.write(this.find(part), text);
  }

  bar(part: PanelPart, fraction: number | undefined): void {
    const bar = this.find(part);
    if (bar) this.bars.show(bar, fraction);
  }

  offerClose(closeLabel: string): void {
    const panel = this.element;
    if (panel !== undefined) this.closeButton(panel, closeLabel);
  }

  private build(stopLabel: string, onStop: () => void): HTMLElement {
    const panel = this.document.createElement(TAGS.div);
    panel.className = CLASS.panel;
    for (const part of PANEL_PARTS) panel.append(this.part(part));
    panel.append(
      this.buttons.textButton({
        label: stopLabel,
        className: CLASS.panelButton,
        onClick: onStop,
      }),
    );
    return panel;
  }

  private part(part: PanelPart): HTMLElement {
    if (isBar(part)) return this.bars.create(partClass(part));
    const line = this.document.createElement(TAGS.div);
    line.className = partClass(part);
    return line;
  }

  private find(part: PanelPart): HTMLElement | null | undefined {
    return this.element?.querySelector<HTMLElement>(
      bySelector(partClass(part)),
    );
  }

  private write(line: HTMLElement | null | undefined, text: string): void {
    if (line) line.textContent = text;
  }

  // The Stop button becomes Close once the run is over.
  private closeButton(panel: HTMLElement, closeLabel: string): void {
    panel.querySelector(bySelector(CLASS.panelButton))?.replaceWith(
      this.buttons.textButton({
        label: closeLabel,
        className: CLASS.panelButton,
        onClick: () => {
          panel.remove();
        },
      }),
    );
  }
}
