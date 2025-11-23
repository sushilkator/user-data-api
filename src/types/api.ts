export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SuccessResponse<T> extends ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse extends ApiResponse<never> {
  success: false;
  error: string;
  message: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  averageResponseTimeMs: number;
}

export interface CreateUserRequest {
  name: string;
  email: string;
}

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
}

