import { ATTRIBUTES, EVENTS, TAGS } from "../../shared/dom";
import { CLASS, classes } from "./classNames";

export interface ButtonSpec {
  readonly label: string;
  readonly className: string;
  readonly onClick: () => void;
}

// Buttons sit inside Instagram's own links, so a click must not reach them.
export function createButton(
  document: Document,
  spec: ButtonSpec,
): HTMLButtonElement {
  const button = document.createElement(TAGS.button);
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

export function createTextButton(
  document: Document,
  spec: ButtonSpec,
): HTMLButtonElement {
  const button = createButton(document, spec);
  button.textContent = spec.label;
  return button;
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
