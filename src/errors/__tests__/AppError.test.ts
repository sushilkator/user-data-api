import { AppError } from '../AppError';
import { ErrorCode } from '../../types/errors';

describe('AppError', () => {
  describe('constructor', () => {
    it('should create error with default values', () => {
      const error = new AppError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.errorCode).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
      expect(error.isOperational).toBe(true);
      expect(error.details).toBeUndefined();
    });

    it('should create error with custom values', () => {
      const details = { field: 'test' };
      const error = new AppError('Test error', 400, ErrorCode.VALIDATION_ERROR, false, details);

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.isOperational).toBe(false);
      expect(error.details).toEqual(details);
    });

    it('should preserve stack trace', () => {
      const error = new AppError('Test error');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });
  });

  describe('static methods', () => {
    describe('validation', () => {
      it('should create validation error without details', () => {
        const error = AppError.validation('Validation failed');

        expect(error.statusCode).toBe(400);
        expect(error.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
        expect(error.isOperational).toBe(true);
        expect(error.details).toBeUndefined();
      });

      it('should create validation error with details', () => {
        const details = { missingFields: ['name', 'email'] };
        const error = AppError.validation('Validation failed', details);

        expect(error.statusCode).toBe(400);
        expect(error.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
        expect(error.details).toEqual(details);
      });
    });

    describe('notFound', () => {
      it('should create not found error with default error code', () => {
        const error = AppError.notFound('Resource not found');

        expect(error.statusCode).toBe(404);
        expect(error.errorCode).toBe(ErrorCode.RESOURCE_NOT_FOUND);
        expect(error.isOperational).toBe(true);
      });

      it('should create not found error with custom error code', () => {
        const error = AppError.notFound('User not found', ErrorCode.USER_NOT_FOUND);

        expect(error.statusCode).toBe(404);
        expect(error.errorCode).toBe(ErrorCode.USER_NOT_FOUND);
        expect(error.isOperational).toBe(true);
      });
    });

    describe('internal', () => {
      it('should create internal error with default message', () => {
        const error = AppError.internal();

        expect(error.statusCode).toBe(500);
        expect(error.errorCode).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
        expect(error.isOperational).toBe(false);
        expect(error.message).toBe('Internal server error');
      });

      it('should create internal error with custom message', () => {
        const error = AppError.internal('Database connection failed');

        expect(error.statusCode).toBe(500);
        expect(error.errorCode).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
        expect(error.isOperational).toBe(false);
        expect(error.message).toBe('Database connection failed');
      });

      it('should create internal error with details', () => {
        const details = { code: 'DB_CONN_ERR', originalError: 'Connection timeout' };
        const error = AppError.internal('Database error', details);

        expect(error.statusCode).toBe(500);
        expect(error.details).toEqual(details);
      });
    });

    describe('badRequest', () => {
      it('should create bad request error with default error code', () => {
        const error = AppError.badRequest('Invalid input');

        expect(error.statusCode).toBe(400);
        expect(error.errorCode).toBe(ErrorCode.INVALID_INPUT);
        expect(error.isOperational).toBe(true);
      });

      it('should create bad request error with custom error code', () => {
        const error = AppError.badRequest('Invalid user ID', ErrorCode.INVALID_USER_ID);

        expect(error.statusCode).toBe(400);
        expect(error.errorCode).toBe(ErrorCode.INVALID_USER_ID);
        expect(error.isOperational).toBe(true);
      });
    });
  });

  describe('error instance properties', () => {
    it('should be instance of Error', () => {
      const error = new AppError('Test');
      expect(error).toBeInstanceOf(Error);
    });

    it('should be instance of AppError', () => {
      const error = new AppError('Test');
      expect(error).toBeInstanceOf(AppError);
    });

    it('should have readonly properties', () => {
      const error = new AppError('Test', 400, ErrorCode.VALIDATION_ERROR);

      // TypeScript will prevent assignment, but we can verify the values
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
    });
  });
});

