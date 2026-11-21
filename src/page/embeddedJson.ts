import type { ElementFinder } from "../shared/dom";
import { parseResponse } from "./responseText";

const embeddedJson = 'script[type="application/json"]';

// Instagram embeds the data for the first screen in the HTML itself.
export function scanEmbeddedJson(
  document: ElementFinder,
  sink: (value: unknown) => void,
): void {
  for (const script of document.querySelectorAll(embeddedJson))
    scanScript(script, sink);
}

function scanScript(script: Element, sink: (value: unknown) => void): void {
  for (const value of parseResponse(script.textContent)) sink(value);
}
