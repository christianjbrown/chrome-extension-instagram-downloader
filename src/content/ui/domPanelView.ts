import { TAGS } from "../../shared/dom";
import { bySelector } from "./classNames";
import type { PanelPart, PanelView, TextButtons } from "./ports";

// The panel itself, and its one button, which is found again to swap Stop
// for Close.
export const PANEL_CLASS = "igdl-panel";
export const PANEL_BUTTON_CLASS = "igdl-panel-button";

// Builds the fixed panel on the page from its parts, top to bottom, with its
// one button below them.
export class DomPanelView implements PanelView {
  private element: HTMLElement | undefined;

  constructor(
    private readonly document: Document,
    private readonly buttons: TextButtons,
    private readonly parts: readonly PanelPart[],
  ) {}

  show(stopLabel: string, onStop: () => void): void {
    this.element?.remove();
    const panel = this.build(stopLabel, onStop);
    this.document.body.append(panel);
    this.element = panel;
  }

  offerClose(closeLabel: string): void {
    const panel = this.element;
    if (panel !== undefined) this.closeButton(panel, closeLabel);
  }

  private build(stopLabel: string, onStop: () => void): HTMLElement {
    const panel = this.document.createElement(TAGS.div);
    panel.className = PANEL_CLASS;
    for (const part of this.parts) panel.append(part.create());
    panel.append(
      this.buttons.textButton({
        label: stopLabel,
        className: PANEL_BUTTON_CLASS,
        onClick: onStop,
      }),
    );
    return panel;
  }

  // The Stop button becomes Close once the run is over.
  private closeButton(panel: HTMLElement, closeLabel: string): void {
    panel.querySelector(bySelector(PANEL_BUTTON_CLASS))?.replaceWith(
      this.buttons.textButton({
        label: closeLabel,
        className: PANEL_BUTTON_CLASS,
        onClick: () => {
          panel.remove();
        },
      }),
    );
  }
}
