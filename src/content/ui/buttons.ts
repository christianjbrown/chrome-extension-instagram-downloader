import { ATTRIBUTES, EVENTS, TAGS } from "../../shared/dom";
import { CLASS, classes } from "./classNames";
import type { ButtonFactory, ButtonSpec } from "./ports";

// Buttons sit inside Instagram's own links, so a click must not reach them.
export class DomButtons implements ButtonFactory {
  constructor(private readonly document: Document) {}

  button(spec: ButtonSpec): HTMLButtonElement {
    const button = this.document.createElement(TAGS.button);
    button.type = "button";
    button.className = spec.className;
    button.title = spec.label;
    button.setAttribute(ATTRIBUTES.ariaLabel, spec.label);
    button.addEventListener(EVENTS.click, (event) => {
      event.preventDefault();
      event.stopPropagation();
      spec.onClick();
    });
    return button;
  }

  textButton(spec: ButtonSpec): HTMLButtonElement {
    const button = this.button(spec);
    button.textContent = spec.label;
    return button;
  }
}

export const BUTTON_ICONS = [
  "download",
  "download-all",
  "picture",
  "folder",
  "following",
] as const;
export type ButtonIcon = (typeof BUTTON_ICONS)[number];

// A labelled button with its icon before the text; the icon is drawn in CSS.
export const textButtonClass = (icon: ButtonIcon): string =>
  classes(CLASS.textButton, `${CLASS.iconPrefix}${icon}`);
