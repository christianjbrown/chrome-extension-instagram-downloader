// Runs Instagram's own Relay queries through its network layer, which hands
// back plain JSON rather than the masked fragments its components see.

export type ModuleRequire = (name: string) => unknown;

export function windowRequire(target: { require?: unknown }): ModuleRequire {
  return (name) => {
    if (typeof target.require !== "function")
      throw new Error("Instagram has not finished loading");
    return (target.require as ModuleRequire)(name);
  };
}

export interface RelayQuery {
  readonly params: unknown;
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

export type JsonObject = Record<string, unknown>;

export const isJsonObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null;

const isQuery = (value: unknown): value is RelayQuery =>
  isJsonObject(value) && value.params !== undefined;

export class RelayClient {
  constructor(private readonly require: ModuleRequire) {}

  query(moduleName: string, member?: string): RelayQuery {
    const loaded = this.require(moduleName);
    const query =
      member === undefined || !isJsonObject(loaded) ? loaded : loaded[member];
    if (!isQuery(query)) throw new Error(`${moduleName} is not available`);
    return query;
  }

  run(query: RelayQuery, variables: JsonObject): Promise<JsonObject> {
    const environment = this.require(
      "PolarisRelayEnvironment",
    ) as RelayEnvironment;
    return new Promise((resolve, reject) => {
      const responses: unknown[] = [];
      environment
        .getNetwork()
        .execute(query.params, variables, { force: true })
        .subscribe({
          next: (response) => responses.push(response.data),
          error: reject,
          complete: () => {
            const data = responses.find(isJsonObject);
            if (data === undefined) reject(new Error("Instagram sent no data"));
            else resolve(data);
          },
        });
    });
  }
}
