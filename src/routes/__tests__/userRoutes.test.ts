import request from 'supertest';
import express from 'express';
import userRoutes from '../userRoutes';
import { userService } from '../../services/userService';
import { metrics } from '../../middleware/metrics';
import { errorHandler, notFoundHandler } from '../../middleware/errorHandler';

// Mock userService
jest.mock('../../services/userService', () => ({
  userService: {
    getUserById: jest.fn(),
    createUser: jest.fn(),
    clearCache: jest.fn(),
    getCacheStats: jest.fn(),
  },
}));

// Mock metrics
jest.mock('../../middleware/metrics', () => ({
  metrics: {
    getAverageResponseTimeMs: jest.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use('/', userRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const mockMetrics = metrics as jest.Mocked<typeof metrics>;

describe('User Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMetrics.getAverageResponseTimeMs.mockReturnValue(0);
  });

  describe('GET /users/:id', () => {
    it('should return user for valid ID', async () => {
      const mockUser = { id: 1, name: 'John Doe', email: 'john@example.com' };
      (userService.getUserById as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app).get('/users/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockUser,
      });
      expect(userService.getUserById).toHaveBeenCalledWith(1);
    });

    it('should return 404 for non-existent user', async () => {
      (userService.getUserById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/users/999');

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        success: false,
        error: 'User with id 999 not found.',
        errorCode: 'USER_NOT_FOUND',
        message: 'User with id 999 not found.',
      });
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path');
    });

    it('should return 400 for invalid ID', async () => {
      const response = await request(app).get('/users/invalid');

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid user id.',
        errorCode: 'INVALID_USER_ID',
        message: 'Invalid user id.',
      });
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path');
      expect(userService.getUserById).not.toHaveBeenCalled();
    });

    it('should return 400 for negative ID', async () => {
      const response = await request(app).get('/users/-1');

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid user id.',
        errorCode: 'INVALID_USER_ID',
      });
    });

    it('should return 400 for zero ID', async () => {
      const response = await request(app).get('/users/0');

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid user id.',
        errorCode: 'INVALID_USER_ID',
      });
    });

    it('should handle errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (userService.getUserById as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).get('/users/1');

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        success: false,
        errorCode: 'INTERNAL_SERVER_ERROR',
      });
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path');
      consoleSpy.mockRestore();
    });
  });

  describe('POST /users', () => {
    it('should create user with valid data', async () => {
      const mockUser = { id: 4, name: 'Test User', email: 'test@example.com' };
      (userService.createUser as jest.Mock).mockReturnValue(mockUser);

      const response = await request(app)
        .post('/users')
        .send({ name: 'Test User', email: 'test@example.com' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: mockUser,
        message: 'User created successfully',
      });
      expect(userService.createUser).toHaveBeenCalledWith(
        'Test User',
        'test@example.com'
      );
    });

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/users')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Name is required',
        errorCode: 'VALIDATION_ERROR',
        message: 'Name is required',
      });
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path');
      expect(userService.createUser).not.toHaveBeenCalled();
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/users')
        .send({ name: 'Test User' });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        errorCode: 'VALIDATION_ERROR',
      });
      expect(userService.createUser).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/users')
        .send({ name: 'Test User', email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid email format',
        errorCode: 'VALIDATION_ERROR',
        message: 'Invalid email format',
      });
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path');
      expect(userService.createUser).not.toHaveBeenCalled();
    });

    it('should accept valid email formats', async () => {
      const mockUser = { id: 5, name: 'Test', email: 'test+tag@example.co.uk' };
      (userService.createUser as jest.Mock).mockReturnValue(mockUser);

      const response = await request(app)
        .post('/users')
        .send({ name: 'Test', email: 'test+tag@example.co.uk' });

      expect(response.status).toBe(201);
      expect(userService.createUser).toHaveBeenCalled();
    });
  });

  describe('DELETE /cache', () => {
    it('should clear cache', async () => {
      const response = await request(app).delete('/cache');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: null,
        message: 'Cache cleared.',
      });
      expect(userService.clearCache).toHaveBeenCalled();
    });
  });

  describe('GET /cache-status', () => {
    it('should return cache statistics', async () => {
      const mockStats = {
        hits: 10,
        misses: 5,
        size: 3,
      };
      (userService.getCacheStats as jest.Mock).mockReturnValue(mockStats);
      mockMetrics.getAverageResponseTimeMs.mockReturnValue(123.45);

      const response = await request(app).get('/cache-status');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('hits', 10);
      expect(response.body.data).toHaveProperty('misses', 5);
      expect(response.body.data).toHaveProperty('size', 3);
      expect(response.body.data).toHaveProperty('averageResponseTimeMs', 123.45);
    });

    it('should handle error when getCacheStats throws', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (userService.getCacheStats as jest.Mock).mockImplementation(() => {
        throw new Error('Cache stats error');
      });

      const response = await request(app).get('/cache-status');

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to retrieve cache statistics',
        errorCode: 'INTERNAL_SERVER_ERROR',
      });
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path');

      consoleSpy.mockRestore();
    });

    it('should handle error when getAverageResponseTimeMs throws', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockStats = {
        hits: 10,
        misses: 5,
        size: 3,
      };
      (userService.getCacheStats as jest.Mock).mockReturnValue(mockStats);
      mockMetrics.getAverageResponseTimeMs.mockImplementation(() => {
        throw new Error('Metrics error');
      });

      const response = await request(app).get('/cache-status');

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to retrieve cache statistics',
        errorCode: 'INTERNAL_SERVER_ERROR',
      });

      consoleSpy.mockRestore();
    });
  });
});

