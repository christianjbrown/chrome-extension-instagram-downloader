/** The address, read against base when given, or undefined when it is not one. */
export function parseUrl(value: string, base?: string): URL | undefined {
  try {
    return new URL(value, base);
  } catch {
    return undefined;
  }
}
