import { ATTRIBUTES, EVENTS, type ElementMaker, TAGS } from "../../shared/dom";
import { classes } from "./classNames";
import type {
  ButtonSpec,
  IconButtons,
  IconClasses,
  TextButtons,
} from "./ports";

// The look every labelled button shares.
export const TEXT_BUTTON_CLASS = "igdl-text-button";

// Begins the class that names the icon drawn on a labelled button.
export const ICON_CLASS_PREFIX = "igdl-icon-";

// Buttons sit inside Instagram's own links, so a click must not reach them.
export class DomButtons implements IconButtons, TextButtons {
  constructor(private readonly document: ElementMaker) {}

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

// A labelled button with its icon before the text; the icon is drawn in CSS.
export class TextButtonClasses implements IconClasses {
  labelled(icon: string): string {
    return classes(TEXT_BUTTON_CLASS, `${ICON_CLASS_PREFIX}${icon}`);
  }
}
