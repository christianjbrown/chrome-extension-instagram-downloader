// Reads the JSON Instagram's own requests bring back, without changing them.
import { EVENTS } from "../shared/dom";
import type { UrlPolicy } from "./ports";
import { parseResponse } from "./responseText";

type Sink = (value: unknown) => void;

// Response types that leave the body readable as text.
const textResponseTypes = new Set<XMLHttpRequestResponseType>(["", "text"]);

function feed(text: string, sink: Sink): void {
  for (const value of parseResponse(text)) sink(value);
}

// open(method, url, ...) takes the address second.
const openUrlArgument = 1;

interface TappedRequest extends XMLHttpRequest {
  igdlUrl?: string;
}

export function tapXhr(
  prototype: XMLHttpRequest,
  sink: Sink,
  policy: UrlPolicy,
): void {
  type Method = (...args: unknown[]) => void;
  const originalOpen = Reflect.get(prototype, "open") as Method;
  const originalSend = Reflect.get(prototype, "send") as Method;
  prototype.open = function (this: TappedRequest, ...args: unknown[]) {
    this.igdlUrl = String(args[openUrlArgument]);
    Reflect.apply(originalOpen, this, args);
  };
  prototype.send = function (this: TappedRequest, ...args: unknown[]) {
    if (policy.isWatched(this.igdlUrl ?? "")) {
      this.addEventListener(EVENTS.load, () => {
        if (textResponseTypes.has(this.responseType))
          feed(this.responseText, sink);
      });
    }
    Reflect.apply(originalSend, this, args);
  };
}

// A Request carries its own url; a string or URL is the url.
const isRequest = (input: RequestInfo | URL): input is Request =>
  typeof input === "object" && "url" in input;

export function tapFetch(
  target: { fetch: typeof fetch },
  sink: Sink,
  policy: UrlPolicy,
): void {
  const original = target.fetch.bind(target);
  target.fetch = async (input, init) => {
    const response = await original(input, init);
    const url = isRequest(input) ? input.url : String(input);
    if (policy.isWatched(url)) {
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
