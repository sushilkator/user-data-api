import axios, { AxiosInstance } from 'axios';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const CACHE_SERVICE_URL = process.env.CACHE_SERVICE_URL || 'http://localhost:3002';

export class ServiceClient {
  private userService: AxiosInstance;
  private cacheService: AxiosInstance;

  constructor() {
    this.userService = axios.create({
      baseURL: USER_SERVICE_URL,
      timeout: 5000,
    });

    this.cacheService = axios.create({
      baseURL: CACHE_SERVICE_URL,
      timeout: 5000,
    });
  }

  async getUserById(id: string): Promise<unknown> {
    const response = await this.userService.get(`/users/${id}`);
    return response.data;
  }

  async createUser(data: { name: string; email: string }): Promise<unknown> {
    const response = await this.userService.post('/users', data);
    return response.data;
  }

  async getAllUsers(): Promise<unknown> {
    const response = await this.userService.get('/users');
    return response.data;
  }

  async clearCache(): Promise<unknown> {
    const response = await this.cacheService.delete('/cache');
    return response.data;
  }

  async getCacheStatus(): Promise<unknown> {
    const response = await this.cacheService.get('/cache/status');
    return response.data;
  }
}

export const serviceClient = new ServiceClient();

