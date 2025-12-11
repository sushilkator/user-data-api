import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { ErrorCode } from '../types/errors';
import { ErrorResponse } from '../types/api';

const formatError = (error: Error | AppError, _req: Request): ErrorResponse => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (error instanceof AppError) {
    return {
      success: false,
      error: error.errorCode,
      message: error.message,
    };
  }

  return {
    success: false,
    error: ErrorCode.INTERNAL_SERVER_ERROR,
    message: isDevelopment ? error.message : 'An unexpected error occurred.',
  };
};

const logError = (error: Error | AppError): void => {
  if (error instanceof AppError && error.isOperational) {
    console.error('Operational Error:', {
      message: error.message,
      errorCode: error.errorCode,
      statusCode: error.statusCode,
    });
  } else {
    console.error('Unexpected Error:', {
      message: error.message,
      stack: error.stack,
    });
  }
};

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logError(error);

  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const errorResponse = formatError(error, req);
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(statusCode).json({
    ...errorResponse,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    ...(isDevelopment && error instanceof AppError && error.details
      ? { details: error.details }
      : {}),
    ...(isDevelopment && !(error instanceof AppError)
      ? {
          details: {
            stack: error.stack,
            name: error.name,
          },
        }
      : {}),
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: ErrorCode.RESOURCE_NOT_FOUND,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
};

