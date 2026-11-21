import { BridgeServer, type Handlers } from "../../src/page/bridgeServer";
import { PAGE_CONFIG } from "../../src/page/config";
import { ProcedureInputs } from "../../src/page/procedureInputs";

const pageWindow = {} as unknown as MessageEventSource;

function event(
  data: unknown,
  origin = "https://www.instagram.com",
  withPort = true,
  source: unknown = pageWindow,
) {
  const port = { postMessage: vi.fn() };
  return {
    port,
    event: {
      data,
      origin,
      source,
      ports: withPort ? [port] : [],
    } as unknown as MessageEvent,
  };
}

const handlers = {
  viewer: () => Promise.resolve({ id: "1", username: "me" }),
  media: () => Promise.reject(new Error("broken")),
  account: () => Promise.reject(new Error("x")),
  // Instagram's code can reject with things that are not Errors.
  // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
  postsPage: () => Promise.reject("plain string"),
} as unknown as Handlers;

describe("BridgeServer", () => {
  const server = new BridgeServer(
    handlers,
    { origin: "https://www.instagram.com", source: pageWindow },
    { isRefusal: (error) => error instanceof Error && error.message === "x" },
    new ProcedureInputs(PAGE_CONFIG.inputLimits),
  );

  it("answers a request on its port", async () => {
    const { port, event: e } = event({ igdlProcedure: "viewer", input: {} });
    await server.handle(e);
    expect(port.postMessage).toHaveBeenCalledWith({
      ok: true,
      value: { id: "1", username: "me" },
    });
  });

  it("reports failures as messages", async () => {
    const failed = event({ igdlProcedure: "media", input: { mediaId: "1" } });
    await server.handle(failed.event);
    expect(failed.port.postMessage).toHaveBeenCalledWith({
      ok: false,
      error: "broken",
    });
    const thrown = event({
      igdlProcedure: "postsPage",
      input: { username: "a" },
    });
    await server.handle(thrown.event);
    expect(thrown.port.postMessage).toHaveBeenCalledWith({
      ok: false,
      error: "plain string",
    });
    const unknown = event({ igdlProcedure: "nothing", input: {} });
    await server.handle(unknown.event);
    expect(unknown.port.postMessage).toHaveBeenCalledWith({
      ok: false,
      error: "Unknown request",
    });
  });

  it("rejects inherited names and inputs of the wrong shape", async () => {
    for (const name of ["constructor", "toString", "__proto__", "reel"]) {
      const { port, event: e } = event({ igdlProcedure: name, input: {} });
      await server.handle(e);
      expect(port.postMessage).toHaveBeenCalledWith({
        ok: false,
        error: "Unknown request",
      });
    }
    for (const input of [null, [], { mediaId: "../x" }, "x"]) {
      const { port, event: e } = event({ igdlProcedure: "media", input });
      await server.handle(e);
      expect(port.postMessage).toHaveBeenCalledWith({
        ok: false,
        error: "Invalid request",
      });
    }
  });

  it("ignores other origins, port-less messages and unrelated data", async () => {
    for (const { port, event: e } of [
      event({ igdlProcedure: "viewer" }, "https://evil.example"),
      event({ igdlProcedure: "viewer" }, undefined, false),
      event({ igdlProcedure: "viewer", input: {} }, undefined, true, {}),
      event({ hello: true }),
    ]) {
      await server.handle(e);
      expect(port.postMessage).not.toHaveBeenCalled();
    }
  });

  it("listens for window messages", async () => {
    const target = { addEventListener: vi.fn() };
    server.listen(target);
    const listener = target.addEventListener.mock.calls[0]?.[1] as (
      e: MessageEvent,
    ) => void;
    const { port, event: e } = event({ igdlProcedure: "viewer", input: {} });
    listener(e);
    await vi.waitFor(() => {
      expect(port.postMessage).toHaveBeenCalled();
    });
  });

  it("flags a rate limit so the content script knows to wait", async () => {
    const refused = event({
      igdlProcedure: "account",
      input: { username: "a" },
    });
    await server.handle(refused.event);
    expect(refused.port.postMessage).toHaveBeenCalledWith({
      ok: false,
      error: "x",
      refused: true,
    });
  });
});
