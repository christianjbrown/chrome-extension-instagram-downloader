// Reads the JSON Instagram's own requests bring back, without changing them.

type Sink = (value: unknown) => void;

const watched = /\/(?:graphql|api)\//;

export function isWatchedUrl(url: string): boolean {
  return watched.test(url);
}

// Responses can carry a "for (;;);" guard and several JSON documents, one per
// line, when Instagram streams deferred parts of a query.
export function parseResponse(text: string): unknown[] {
  return text
    .replace(/^for \(;;\);/, "")
    .split("\n")
    .flatMap((line) => {
      try {
        return [JSON.parse(line) as unknown];
      } catch {
        return [];
      }
    });
}

function feed(text: string, sink: Sink): void {
  for (const value of parseResponse(text)) sink(value);
}

interface TappedRequest extends XMLHttpRequest {
  igdlUrl?: string;
}

export function tapXhr(prototype: XMLHttpRequest, sink: Sink): void {
  type Method = (...args: unknown[]) => void;
  const originalOpen = Reflect.get(prototype, "open") as Method;
  const originalSend = Reflect.get(prototype, "send") as Method;
  prototype.open = function (this: TappedRequest, ...args: unknown[]) {
    this.igdlUrl = String(args[1]);
    Reflect.apply(originalOpen, this, args);
  };
  prototype.send = function (this: TappedRequest, ...args: unknown[]) {
    if (isWatchedUrl(this.igdlUrl ?? "")) {
      this.addEventListener("load", () => {
        if (this.responseType === "" || this.responseType === "text")
          feed(this.responseText, sink);
      });
    }
    Reflect.apply(originalSend, this, args);
  };
}

export function tapFetch(target: { fetch: typeof fetch }, sink: Sink): void {
  const original = target.fetch.bind(target);
  target.fetch = async (input, init) => {
    const response = await original(input, init);
    const url = input instanceof Request ? input.url : String(input);
    if (isWatchedUrl(url)) {
      void response
        .clone()
        .text()
        .then((text) => {
          feed(text, sink);
        })
        .catch(() => undefined);
    }
    return response;
  };
}
