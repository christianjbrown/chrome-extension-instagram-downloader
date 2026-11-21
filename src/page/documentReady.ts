import { EVENTS, LOADING_STATE } from "../shared/dom";

type ParsingDocument = Pick<Document, "readyState" | "addEventListener">;

/** Runs callback once the document's HTML has all arrived, at once if it has. */
export function whenParsed(
  document: ParsingDocument,
  callback: () => void,
): void {
  if (document.readyState === LOADING_STATE)
    document.addEventListener(EVENTS.contentLoaded, callback);
  else callback();
}
