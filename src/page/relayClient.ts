// Runs Instagram's own Relay queries through its network layer, which hands
// back plain JSON rather than the masked fragments its components see.
import { isJsonObject, type JsonObject } from "../shared/json";
import { MODULES } from "./instagramApi";
import type { ModuleRequire, RelayQuery, Relay } from "./ports";

const text = {
  notLoaded: "Instagram has not finished loading",
  unavailable: "is not available",
  noData: "Instagram sent no data",
} as const;

export function windowRequire(target: { require?: unknown }): ModuleRequire {
  return (name) => {
    if (typeof target.require !== "function") throw new Error(text.notLoaded);
    return (target.require as ModuleRequire)(name);
  };
}

interface RelayObserver {
  next(response: { data?: unknown }): void;
  error(error: unknown): void;
  complete(): void;
}

interface RelayEnvironment {
  getNetwork(): {
    execute(
      params: unknown,
      variables: unknown,
      config: unknown,
    ): { subscribe(observer: RelayObserver): unknown };
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

export class RelayClient implements Relay {
  constructor(private readonly require: ModuleRequire) {}

  query(moduleName: string, member?: string): RelayQuery {
    const query = memberOf(this.require(moduleName), member);
    if (!isQuery(query)) throw new Error(`${moduleName} ${text.unavailable}`);
    return query;
  }

  run(query: RelayQuery, variables: JsonObject): Promise<JsonObject> {
    const environment = this.require(
      MODULES.relayEnvironment,
    ) as RelayEnvironment;
    return new Promise((resolve, reject) => {
      const responses: unknown[] = [];
      environment
        .getNetwork()
        .execute(query.params, variables, fetchFresh)
        .subscribe({
          next: (response) => responses.push(response.data),
          error: reject,
          complete: () => {
            const data = responses.find(isJsonObject);
            if (data === undefined) reject(new Error(text.noData));
            else resolve(data);
          },
        });
    });
  }
}
