import { User } from '../types/user';
import { createUser as createMockUser } from '../data/mockUsers';
import { LRUCache } from './lruCache';
import { DbQueue } from './dbQueue';
import { CacheStats } from '../types/cache';

export class UserService {
  private cache: LRUCache<number, User>;
  private dbQueue: DbQueue;
  // Track in-flight requests to dedupe concurrent calls for same user
  private inflight: Map<number, Promise<User | null>> = new Map();

  constructor() {
    // 100 users max, 60s TTL
    this.cache = new LRUCache<number, User>(100, 60_000);
    this.dbQueue = new DbQueue();
    // Clean up expired entries every 10 seconds
    setInterval(() => this.cache.cleanupStaleEntries(), 10_000);
  }

  async getUserById(id: number): Promise<User | null> {
    // Fast path: check cache first
    const cached = this.cache.get(id);
    if (cached) {
      return cached;
    }

    // If already fetching this user, wait for that request
    const existing = this.inflight.get(id);
    if (existing) {
      return existing;
    }

    // Queue the fetch and track it
    const fetchPromise = this.dbQueue.enqueueFetchUser(id);
    this.inflight.set(id, fetchPromise);

    try {
      const user = await fetchPromise;
      // Only cache if user exists (don't cache nulls)
      if (user) {
        this.cache.set(id, user);
      }
      return user;
    } finally {
      // Always clean up in-flight tracking
      this.inflight.delete(id);
    }
  }

  createUser(name: string, email: string): User {
    const user = createMockUser(name, email);
    this.cache.set(user.id, user);
    return user;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): CacheStats & { size: number } {
    return this.cache.getStats();
  }
}

export const userService = new UserService();
