// Runs Instagram's own Relay queries through its network layer, which hands
// back plain JSON rather than the masked fragments its components see.
import { isJsonObject, type JsonObject } from "../shared/json";
import { MEMBERS, MODULES } from "./instagramApi";
import { callMember } from "./members";
import type { ModuleRequire, RelayQuery, Relay } from "./ports";

const text = {
  notLoaded: "Instagram has not finished loading",
  unavailable: "is not available",
  noData: "Instagram sent no data",
} as const;

interface LoaderWindow {
  require?: unknown;
}

// Instagram's loader is a function once it has loaded; what it hands back is
// checked by whoever asked for the module.
const hasLoader = (
  target: LoaderWindow,
): target is { require: ModuleRequire } => typeof target.require === "function";

export function windowRequire(target: LoaderWindow): ModuleRequire {
  return (name) => {
    if (!hasLoader(target)) throw new Error(text.notLoaded);
    return target.require(name);
  };
}

// Skips Relay's own store, so every query asks Instagram afresh.
const fetchFresh = { force: true } as const;

const isQuery = (value: unknown): value is RelayQuery =>
  isJsonObject(value) && value.params !== undefined;

// A module that is not an object is the query itself, whatever was asked.
const namedMember = (loaded: unknown, member: string): unknown =>
  isJsonObject(loaded) ? loaded[member] : loaded;

const memberOf = (loaded: unknown, member: string | undefined): unknown =>
  member === undefined ? loaded : namedMember(loaded, member);

// A response that is not an object carries no data.
const dataOf = (response: unknown): unknown =>
  isJsonObject(response) ? response.data : undefined;

function settle(
  responses: readonly unknown[],
  resolve: (data: JsonObject) => void,
  reject: (error: Error) => void,
): void {
  const data = responses.find(isJsonObject);
  if (data === undefined) reject(new Error(text.noData));
  else resolve(data);
}

export class RelayClient implements Relay {
  constructor(private readonly require: ModuleRequire) {}

  query(moduleName: string, member?: string): RelayQuery {
    const query = memberOf(this.require(moduleName), member);
    if (!isQuery(query)) throw new Error(`${moduleName} ${text.unavailable}`);
    return query;
  }

  run(query: RelayQuery, variables: JsonObject): Promise<JsonObject> {
    return new Promise((resolve, reject) => {
      const responses: unknown[] = [];
      callMember(this.execution(query, variables), MEMBERS.subscribe, {
        next: (response: unknown) => responses.push(dataOf(response)),
        error: reject,
        complete: () => {
          settle(responses, resolve, reject);
        },
      });
    });
  }

  // The network layer's answer to a query, which is subscribed to for its
  // responses.
  private execution(query: RelayQuery, variables: JsonObject): unknown {
    const environment = this.require(MODULES.relayEnvironment);
    return callMember(
      callMember(environment, MEMBERS.network),
      MEMBERS.execute,
      query.params,
      variables,
      fetchFresh,
    );
  }
}
