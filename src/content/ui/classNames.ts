// Helpers for the classes content.css styles. Each class is named once, by
// the module that adds it and looks for it to tell its own elements apart
// from Instagram's.

/** The look every icon button shares. */
export const BUTTON_CLASS = "igdl-button";

/** Several classes on one element, the way className takes them. */
export const classes = (...names: readonly string[]): string => names.join(" ");

/** A selector matching an element by one class. */
export const bySelector = (name: string): string => `.${name}`;
