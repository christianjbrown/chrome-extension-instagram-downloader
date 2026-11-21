import type { IterableStore } from "./ports";

// A map that keeps only its newest entries, forgetting the oldest past the
// limit, so a long session cannot grow it without end.
export class BoundedMap<V> implements IterableStore<V> {
  private readonly entries = new Map<string, V>();

  constructor(private readonly limit: number) {}

  get(key: string): V | undefined {
    return this.entries.get(key);
  }

  /** Remembers a value as the newest entry. */
  set(key: string, value: V): void {
    this.entries.delete(key);
    this.entries.set(key, value);
    if (this.entries.size <= this.limit) return;
    for (const oldest of this.entries.keys()) {
      this.entries.delete(oldest);
      return;
    }
  }

  values(): MapIterator<V> {
    return this.entries.values();
  }
}
