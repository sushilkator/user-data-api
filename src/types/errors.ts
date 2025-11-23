export enum ErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_USER_ID = 'INVALID_USER_ID',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

export interface ErrorResponse {
  success: false;
  error: string;
  errorCode: ErrorCode;
  message: string;
  details?: unknown;
  timestamp: string;
  path?: string;
}

