// Any page none of the features looks for.
const OTHER_KIND = "other";

export interface OtherRoute {
  readonly kind: typeof OTHER_KIND;
}

export const OTHER_ROUTE: OtherRoute = { kind: OTHER_KIND };
