// A line of words on the progress panel. Before a panel is up there is
// nothing to write into, so the words are left alone.
import { TAGS } from "../../shared/dom";
import type { PanelLine, PanelPart } from "./ports";

export class DomPanelLine implements PanelPart, PanelLine {
  private element: HTMLElement | undefined;

  constructor(
    private readonly document: Document,
    private readonly className: string,
  ) {}

  create(): HTMLElement {
    const line = this.document.createElement(TAGS.div);
    line.className = this.className;
    this.element = line;
    return line;
  }

  write(text: string): void {
    if (this.element) this.element.textContent = text;
  }
}
