// Reads the JSON Instagram's own requests bring back, without changing them.
import { EVENTS } from "../shared/dom";
import { methodOf } from "../shared/members";
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

// The request methods wrapped to watch each request.
const xhrMethods = { open: "open", send: "send" } as const;

// A request sent before open named an address has none to watch.
const noUrl = "";

const requestUrl = (request: TappedRequest): string => request.igdlUrl ?? noUrl;

function feedText(request: TappedRequest, sink: Sink): void {
  if (textResponseTypes.has(request.responseType))
    feed(request.responseText, sink);
}

function watch(request: TappedRequest, sink: Sink, policy: UrlPolicy): void {
  if (policy.isWatched(requestUrl(request)))
    request.addEventListener(EVENTS.load, () => {
      feedText(request, sink);
    });
}

export function tapXhr(
  prototype: XMLHttpRequest,
  sink: Sink,
  policy: UrlPolicy,
): void {
  const originalOpen = methodOf(prototype, xhrMethods.open);
  const originalSend = methodOf(prototype, xhrMethods.send);
  prototype.open = function (this: TappedRequest, ...args: unknown[]) {
    this.igdlUrl = String(args[openUrlArgument]);
    Reflect.apply(originalOpen, this, args);
  };
  prototype.send = function (this: TappedRequest, ...args: unknown[]) {
    watch(this, sink, policy);
    Reflect.apply(originalSend, this, args);
  };
}

// A Request carries its own url; a string or URL is the url.
const isRequest = (input: RequestInfo | URL): input is Request =>
  typeof input === "object" && "url" in input;

const urlOf = (input: RequestInfo | URL): string =>
  isRequest(input) ? input.url : String(input);

function readIfWatched(
  response: Response,
  url: string,
  sink: Sink,
  policy: UrlPolicy,
): void {
  if (policy.isWatched(url))
    void response
      .clone()
      .text()
      .then((text) => {
        feed(text, sink);
      })
      .catch(() => undefined);
}

export function tapFetch(
  target: { fetch: typeof fetch },
  sink: Sink,
  policy: UrlPolicy,
): void {
  const original = target.fetch.bind(target);
  target.fetch = async (input, init) => {
    const response = await original(input, init);
    readIfWatched(response, urlOf(input), sink, policy);
    return response;
  };
}
