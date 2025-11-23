import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { ErrorResponse } from '../types/errors';
import { ErrorCode } from '../types/errors';
import { HttpStatus } from '../types/api';

const formatError = (error: Error | AppError, req: Request): ErrorResponse => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
      errorCode: error.errorCode,
      message: error.message,
      details: isDevelopment ? error.details : undefined,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    };
  }

  return {
    success: false,
    error: isDevelopment ? error.message : 'Internal server error',
    errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
    message: isDevelopment ? error.message : 'An unexpected error occurred.',
    details: isDevelopment
      ? {
          stack: error.stack,
          name: error.name,
        }
      : undefined,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  };
};

const logError = (error: Error | AppError, req: Request): void => {
  const context = {
    message: error.message,
    stack: error.stack,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString(),
  };

  if (error instanceof AppError && error.isOperational) {
    console.warn('Operational Error:', context);
  } else {
    console.error('Unexpected Error:', context);
  }
};

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logError(error, req);

  const statusCode =
    error instanceof AppError ? error.statusCode : HttpStatus.INTERNAL_SERVER_ERROR;

  const errorResponse = formatError(error, req);

  res.status(statusCode).json(errorResponse);
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  const error = AppError.notFound(
    `Route ${req.method} ${req.originalUrl} not found`,
    ErrorCode.RESOURCE_NOT_FOUND
  );
  next(error);
};

