import type { RouteKind, RouteParser, RouteReader } from "./ports";
import type { Route } from "./route";

// Reads the address at call time, so a page Instagram swapped in without a
// reload is seen as it is now.
export class AddressRoute<R extends Route> implements RouteReader<R> {
  constructor(
    private readonly pathname: () => string,
    private readonly parser: RouteParser,
    private readonly kind: RouteKind<R>,
  ) {}

  read(): R | undefined {
    const route = this.parser.parse(this.pathname());
    return this.kind.matches(route) ? route : undefined;
  }
}
