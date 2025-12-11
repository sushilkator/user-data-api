import { ErrorCode } from '../types/errors';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    errorCode: ErrorCode,
    isOperational: boolean = true,
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.details = details;

    Object.setPrototypeOf(this, AppError.prototype);
  }

  static validation(message: string, details?: unknown): AppError {
    return new AppError(message, 400, ErrorCode.VALIDATION_ERROR, true, details);
  }

  static badRequest(message: string, errorCode: ErrorCode = ErrorCode.INVALID_INPUT): AppError {
    return new AppError(message, 400, errorCode, true);
  }

  static notFound(message: string, errorCode: ErrorCode = ErrorCode.RESOURCE_NOT_FOUND): AppError {
    return new AppError(message, 404, errorCode, true);
  }

  static internal(message: string = 'Internal server error', details?: unknown): AppError {
    return new AppError(
      message,
      500,
      ErrorCode.INTERNAL_SERVER_ERROR,
      true,
      details
    );
  }
}

