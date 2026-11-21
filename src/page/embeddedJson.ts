import { parseResponse } from "./responseText";

const embeddedJson = 'script[type="application/json"]';

// Instagram embeds the data for the first screen in the HTML itself.
export function scanEmbeddedJson(
  document: Document,
  sink: (value: unknown) => void,
): void {
  for (const script of document.querySelectorAll(embeddedJson)) {
    for (const value of parseResponse(script.textContent)) sink(value);
  }
}
