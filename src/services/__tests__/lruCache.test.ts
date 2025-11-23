import { LRUCache } from '../lruCache';

describe('LRUCache', () => {
  let cache: LRUCache<string, number>;

  beforeEach(() => {
    cache = new LRUCache<string, number>(3, 1000); // 3 max size, 1 second TTL
  });

  describe('get', () => {
    it('should return undefined for non-existent key', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
      const stats = cache.getStats();
      expect(stats.misses).toBe(1);
      expect(stats.hits).toBe(0);
    });

    it('should return value for existing key', () => {
      cache.set('key1', 100);
      expect(cache.get('key1')).toBe(100);
      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(0);
    });

    it('should return undefined for expired entry', (done) => {
      cache.set('key1', 100);
      setTimeout(() => {
        expect(cache.get('key1')).toBeUndefined();
        const stats = cache.getStats();
        expect(stats.misses).toBe(1);
        done();
      }, 1100);
    });

    it('should refresh recency on get (LRU)', () => {
      cache.set('key1', 100);
      cache.set('key2', 200);
      cache.set('key3', 300);
      
      // Access key1 to make it most recently used
      cache.get('key1');
      
      // Add new key - should evict key2 (least recently used)
      cache.set('key4', 400);
      
      expect(cache.get('key1')).toBe(100); // Still exists
      expect(cache.get('key2')).toBeUndefined(); // Evicted
      expect(cache.get('key3')).toBe(300); // Still exists
      expect(cache.get('key4')).toBe(400); // New entry
    });
  });

  describe('set', () => {
    it('should store value with TTL', () => {
      cache.set('key1', 100);
      expect(cache.get('key1')).toBe(100);
    });

    it('should update existing key', () => {
      cache.set('key1', 100);
      cache.set('key1', 200);
      expect(cache.get('key1')).toBe(200);
      const stats = cache.getStats();
      expect(stats.size).toBe(1);
    });

    it('should evict least recently used when capacity exceeded', () => {
      cache.set('key1', 100);
      cache.set('key2', 200);
      cache.set('key3', 300);
      
      // key1 is least recently used
      cache.set('key4', 400);
      
      expect(cache.get('key1')).toBeUndefined(); // Evicted
      expect(cache.get('key2')).toBe(200);
      expect(cache.get('key3')).toBe(300);
      expect(cache.get('key4')).toBe(400);
    });

    it('should handle capacity of 1', () => {
      const smallCache = new LRUCache<string, number>(1, 1000);
      smallCache.set('key1', 100);
      smallCache.set('key2', 200);
      expect(smallCache.get('key1')).toBeUndefined();
      expect(smallCache.get('key2')).toBe(200);
    });
  });

  describe('clear', () => {
    it('should clear all entries and reset stats', () => {
      cache.set('key1', 100);
      cache.set('key2', 200);
      cache.get('key1'); // Create a hit
      
      cache.clear();
      
      // Check stats immediately after clear (before any get calls)
      let stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0); // Clear resets misses to 0
      expect(stats.size).toBe(0);
      
      // Verify entries are cleared (this will increment misses, but that's expected)
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
      
      // After gets, misses will be 2, but size should still be 0
      stats = cache.getStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('cleanupStaleEntries', () => {
    it('should remove expired entries', (done) => {
      cache.set('key1', 100);
      cache.set('key2', 200);
      
      setTimeout(() => {
        cache.cleanupStaleEntries();
        expect(cache.get('key1')).toBeUndefined();
        expect(cache.get('key2')).toBeUndefined();
        const stats = cache.getStats();
        expect(stats.size).toBe(0);
        done();
      }, 1100);
    });

    it('should not remove non-expired entries', () => {
      cache.set('key1', 100);
      cache.cleanupStaleEntries();
      expect(cache.get('key1')).toBe(100);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      cache.set('key1', 100);
      cache.set('key2', 200);
      cache.get('key1'); // hit
      cache.get('key1'); // hit
      cache.get('nonexistent'); // miss
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.size).toBe(2);
    });

    it('should track hits and misses correctly', () => {
      cache.set('key1', 100);
      cache.get('key1'); // hit
      cache.get('key2'); // miss
      cache.get('key1'); // hit
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle zero TTL', () => {
      const zeroTTLCache = new LRUCache<string, number>(10, 0);
      zeroTTLCache.set('key1', 100);
      expect(zeroTTLCache.get('key1')).toBeUndefined(); // Immediately expired
    });

    it('should handle very large TTL', () => {
      const largeTTLCache = new LRUCache<string, number>(10, 1000000);
      largeTTLCache.set('key1', 100);
      expect(largeTTLCache.get('key1')).toBe(100);
    });

    it('should handle empty key', () => {
      cache.set('', 100);
      expect(cache.get('')).toBe(100);
    });
  });
});

