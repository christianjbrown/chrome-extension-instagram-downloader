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

/** The part of the document that makes elements. */
export type ElementMaker = Pick<Document, "createElement">;

/** The part of the document that makes elements and adds them to the page. */
export type PageBody = Pick<Document, "createElement" | "body">;

/** The part of the page that finds elements in it. */
export type ElementFinder = Pick<ParentNode, "querySelectorAll">;

/** The document's readyState while its HTML is still arriving. */
export const LOADING_STATE: DocumentReadyState = "loading";
