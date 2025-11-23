import { Request, Response, NextFunction } from 'express';
import { errorHandler, asyncHandler, notFoundHandler } from '../errorHandler';
import { AppError } from '../../errors/AppError';
import { ErrorCode } from '../../types/errors';

describe('errorHandler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      originalUrl: '/test',
      method: 'GET',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-agent'),
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('errorHandler', () => {
    it('should handle AppError in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = AppError.notFound('Test error', ErrorCode.USER_NOT_FOUND);
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Test error',
          errorCode: ErrorCode.USER_NOT_FOUND,
          message: 'Test error',
          timestamp: expect.any(String),
          path: '/test',
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle AppError in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = AppError.validation('Test error', { field: 'test' });
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Test error',
          errorCode: ErrorCode.VALIDATION_ERROR,
          details: undefined, // No details in production
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle non-AppError in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Unexpected error');
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Unexpected error',
          errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
          details: expect.objectContaining({
            stack: expect.any(String),
            name: 'Error',
          }),
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle non-AppError in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Unexpected error');
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Internal server error',
          errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'An unexpected error occurred.',
          details: undefined, // No details in production
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should log operational errors as warnings', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const error = AppError.validation('Test error');
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Operational Error:',
        expect.objectContaining({
          message: 'Test error',
          path: '/test',
          method: 'GET',
        })
      );

      consoleSpy.mockRestore();
    });

    it('should log non-operational errors as errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Unexpected error');
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Unexpected Error:',
        expect.objectContaining({
          message: 'Unexpected error',
          path: '/test',
        })
      );

      consoleSpy.mockRestore();
    });

    it('should handle AppError that is not operational', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      // Create AppError with isOperational = false (internal errors are non-operational)
      const error = AppError.internal('Internal error', { code: 'ERR' });
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Should log as error (not warning) because isOperational = false
      expect(consoleSpy).toHaveBeenCalledWith(
        'Unexpected Error:',
        expect.objectContaining({
          message: 'Internal error',
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
        })
      );
      consoleSpy.mockRestore();
    });

    it('should handle AppError that is operational', () => {
      // Test the isOperationalError branch when error is AppError and isOperational is true
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const error = AppError.validation('Test');
      // Verify it's operational
      expect(error.isOperational).toBe(true);
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Operational Error:',
        expect.any(Object)
      );
      consoleSpy.mockRestore();
    });

    it('should handle AppError with details in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const details = { field: 'test', value: 'invalid' };
      const error = AppError.validation('Validation failed', details);
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: details, // Details should be included in development
        })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('asyncHandler', () => {
    it('should wrap async function and catch errors', async () => {
      const asyncFn = asyncHandler(async (_req: Request, _res: Response, _next: NextFunction) => {
        throw new Error('Test error');
      });

      await asyncFn(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should pass through successful async function', async () => {
      const asyncFn = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
        res.status(200).json({ success: true });
      });

      await asyncFn(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle AppError thrown in async function', async () => {
      const asyncFn = asyncHandler(async (_req: Request, _res: Response, _next: NextFunction) => {
        throw AppError.notFound('Not found');
      });

      await asyncFn(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('notFoundHandler', () => {
    it('should create 404 error for unknown routes', () => {
      notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(404);
      expect(error.errorCode).toBe(ErrorCode.RESOURCE_NOT_FOUND);
      expect(error.message).toContain('Route GET /test not found');
    });

    it('should handle different HTTP methods', () => {
      mockRequest.method = 'POST';
      mockRequest.originalUrl = '/unknown';

      notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);

      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toContain('Route POST /unknown not found');
    });

    it('should handle different routes', () => {
      mockRequest.method = 'PUT';
      mockRequest.originalUrl = '/api/v1/users/123';

      notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);

      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.message).toContain('Route PUT /api/v1/users/123 not found');
    });
  });
});

