// Names the DOM itself defines, so both scripts spell each one once.

/** Events the scripts listen for. */
export const EVENTS = {
  abort: "abort",
  click: "click",
  contentLoaded: "DOMContentLoaded",
  load: "load",
  message: "message",
} as const;

/** Attributes the scripts read or set. */
export const ATTRIBUTES = {
  ariaLabel: "aria-label",
  ariaValueMax: "aria-valuemax",
  ariaValueMin: "aria-valuemin",
  ariaValueNow: "aria-valuenow",
  href: "href",
  role: "role",
} as const;

/** Elements the content script creates. */
export const TAGS = {
  anchor: "a",
  button: "button",
  div: "div",
  span: "span",
} as const;

/** The document's readyState while its HTML is still arriving. */
export const LOADING_STATE: DocumentReadyState = "loading";
