import { CacheStats, CacheEntry } from '../types/cache';

export class LRUCache<K, V> {
  private store = new Map<K, CacheEntry<V>>();
  private stats: CacheStats = { hits: 0, misses: 0 };

  constructor(
    private readonly maxSize: number,
    private readonly ttlMs: number
  ) {}

  get(key: K): V | undefined {
    const entry = this.store.get(key);

    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    // Check if expired
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      this.stats.misses++;
      return undefined;
    }

    // Refresh recency (move to end of Map for LRU)
    this.store.delete(key);
    this.store.set(key, entry);

    this.stats.hits++;
    return entry.value;
  }

  set(key: K, value: V): void {
    const expiresAt = Date.now() + this.ttlMs;

    // Update existing or evict oldest if at capacity
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxSize) {
      // Remove least recently used (first key in Map)
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(key, { value, expiresAt });
  }

  clear(): void {
    this.store.clear();
    this.stats = { hits: 0, misses: 0 } as CacheStats;
  }

  cleanupStaleEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt <= now) {
        this.store.delete(key);
      }
    }
  }

  getStats(): CacheStats & { size: number } {
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.store.size,
    };
  }
}
