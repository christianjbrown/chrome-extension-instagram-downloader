import {
  isWatchedUrl,
  parseResponse,
  tapFetch,
  tapXhr,
} from "../../src/page/responseTap";

describe("parseResponse", () => {
  it("drops the guard prefix and reads one document per line", () => {
    expect(parseResponse('for (;;);{"a":1}\n{"b":2}\nnot json')).toEqual([
      { a: 1 },
      { b: 2 },
    ]);
  });
});

describe("isWatchedUrl", () => {
  it("watches GraphQL and API calls only", () => {
    expect(isWatchedUrl("https://www.instagram.com/graphql/query")).toBe(true);
    expect(isWatchedUrl("/api/v1/feed/")).toBe(true);
    expect(isWatchedUrl("/ajax/navigation/")).toBe(false);
  });
});

class FakeXhr {
  responseType = "";
  responseText = "";
  listeners: (() => void)[] = [];
  opened: unknown[] = [];
  sent: unknown[] = [];
  open(...args: unknown[]): void {
    this.opened = args;
  }
  send(...args: unknown[]): void {
    this.sent = args;
  }
  addEventListener(_type: string, listener: () => void): void {
    this.listeners.push(listener);
  }
  load(): void {
    for (const listener of this.listeners) listener();
  }
}

describe("tapXhr", () => {
  const sink = vi.fn();
  beforeAll(() => {
    tapXhr(FakeXhr.prototype as unknown as XMLHttpRequest, sink);
  });

  it("feeds watched text responses to the sink and still sends", () => {
    const request = new FakeXhr();
    request.open("POST", "/graphql/query");
    request.send("body");
    request.responseText = '{"x":1}';
    request.load();
    expect(request.opened).toEqual(["POST", "/graphql/query"]);
    expect(request.sent).toEqual(["body"]);
    expect(sink).toHaveBeenCalledWith({ x: 1 });
  });

  it("reads responses typed as text", () => {
    const request = new FakeXhr();
    request.open("GET", "/api/v1/x");
    request.send();
    request.responseType = "text";
    request.responseText = '{"y":1}';
    request.load();
    expect(sink).toHaveBeenCalledWith({ y: 1 });
  });

  it("skips other URLs and non-text responses", () => {
    sink.mockClear();
    const other = new FakeXhr();
    other.send();
    expect(other.listeners).toHaveLength(0);
    const binary = new FakeXhr();
    binary.open("GET", "/api/v1/x");
    binary.send();
    binary.responseType = "arraybuffer";
    binary.load();
    expect(sink).not.toHaveBeenCalled();
  });
});

describe("tapFetch", () => {
  const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

  it("feeds watched responses to the sink and returns them untouched", async () => {
    const sink = vi.fn();
    const response = new Response('{"z":1}');
    const target = {
      fetch: vi.fn(() => Promise.resolve(response)),
    } as unknown as { fetch: typeof fetch };
    tapFetch(target, sink);
    await expect(target.fetch("/api/v1/x")).resolves.toBe(response);
    await target.fetch(new Request("https://www.instagram.com/graphql/query"));
    await settle();
    expect(sink).toHaveBeenCalledWith({ z: 1 });
  });

  it("leaves other requests and unreadable bodies alone", async () => {
    const sink = vi.fn();
    const broken = {
      clone: () => ({ text: () => Promise.reject(new Error("gone")) }),
    };
    const target = {
      fetch: vi.fn(() => Promise.resolve(broken)),
    } as unknown as { fetch: typeof fetch };
    tapFetch(target, sink);
    await target.fetch("/static/app.js");
    await target.fetch("/api/v1/x");
    await settle();
    expect(sink).not.toHaveBeenCalled();
  });
});
