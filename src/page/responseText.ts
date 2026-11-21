// Reads the JSON in the text of one of Instagram's responses.

// The guard Instagram puts in front of JSON so it cannot run as a script.
const scriptGuard = /^for \(;;\);/;

// Responses can carry a "for (;;);" guard and several JSON documents, one per
// line, when Instagram streams deferred parts of a query.
export function parseResponse(text: string): unknown[] {
  return text
    .replace(scriptGuard, "")
    .split("\n")
    .flatMap((line) => {
      try {
        const parsed: unknown = JSON.parse(line);
        return [parsed];
      } catch {
        return [];
      }
    });
}
