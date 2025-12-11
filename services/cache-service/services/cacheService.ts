import { redisClient } from '../config/redis';
import { User } from '../../../shared/types/user';

const CACHE_TTL = 60; // 60 seconds
const CACHE_PREFIX = 'user:';

export class CacheService {
  async get(key: string): Promise<User | null> {
    try {
      const cached = await redisClient.get(`${CACHE_PREFIX}${key}`);
      if (!cached) {
        return null;
      }
      return JSON.parse(cached) as User;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: User): Promise<void> {
    try {
      await redisClient.setEx(
        `${CACHE_PREFIX}${key}`,
        CACHE_TTL,
        JSON.stringify(value)
      );
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await redisClient.del(`${CACHE_PREFIX}${key}`);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await redisClient.keys(`${CACHE_PREFIX}*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  async getStats(): Promise<{ size: number; hits: number; misses: number }> {
    try {
      const keys = await redisClient.keys(`${CACHE_PREFIX}*`);
      return {
        size: keys.length,
        hits: 0,
        misses: 0,
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { size: 0, hits: 0, misses: 0 };
    }
  }
}

