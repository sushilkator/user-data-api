import axios from 'axios';
import { User } from '../../shared/types/user';

const CACHE_SERVICE_URL = process.env.CACHE_SERVICE_URL || 'http://localhost:3002';

export class CacheService {
  async get(key: string): Promise<User | null> {
    try {
      const response = await axios.get(`${CACHE_SERVICE_URL}/cache/${key}`);
      if (response.data.success && response.data.data) {
        return response.data.data as User;
      }
      return null;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: User): Promise<void> {
    try {
      await axios.post(`${CACHE_SERVICE_URL}/cache/${key}`, value);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await axios.delete(`${CACHE_SERVICE_URL}/cache/${key}`);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }
}

