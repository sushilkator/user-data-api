export interface CacheStats {
  hits: number;
  misses: number;
}

export interface CacheEntry<V> {
  value: V;
  expiresAt: number;
}

