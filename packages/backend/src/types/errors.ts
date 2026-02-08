/**
 * Error Models for Onramp
 * Defines error types and codes used throughout the application
 */

// ============================================================================
// Error Types
// ============================================================================

export interface APIError {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

// ============================================================================
// Error Codes
// ============================================================================

export enum ErrorCode {
  // Repository Errors
  INVALID_REPOSITORY_URL = 'INVALID_REPOSITORY_URL',
  REPOSITORY_NOT_FOUND = 'REPOSITORY_NOT_FOUND',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Service Errors
  LLM_SERVICE_UNAVAILABLE = 'LLM_SERVICE_UNAVAILABLE',
  ANALYSIS_TIMEOUT = 'ANALYSIS_TIMEOUT',

  // Validation Errors
  INVALID_USER_PROFILE = 'INVALID_USER_PROFILE',

  // Infrastructure Errors
  CACHE_ERROR = 'CACHE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',

  // Generic Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
}

// ============================================================================
// Error Messages
// ============================================================================

export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.INVALID_REPOSITORY_URL]:
    'The provided repository URL is malformed or inaccessible',
  [ErrorCode.REPOSITORY_NOT_FOUND]: 'The repository does not exist on GitHub',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'GitHub API rate limit has been exceeded',
  [ErrorCode.LLM_SERVICE_UNAVAILABLE]: 'The LLM service is currently unavailable',
  [ErrorCode.ANALYSIS_TIMEOUT]: 'Repository analysis exceeded the time limit',
  [ErrorCode.INVALID_USER_PROFILE]: 'User profile data validation failed',
  [ErrorCode.CACHE_ERROR]: 'Cache operation failed',
  [ErrorCode.DATABASE_ERROR]: 'Database operation failed',
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'An internal server error occurred',
  [ErrorCode.BAD_REQUEST]: 'The request is invalid',
  [ErrorCode.UNAUTHORIZED]: 'Authentication is required',
  [ErrorCode.FORBIDDEN]: 'Access to this resource is forbidden',
  [ErrorCode.NOT_FOUND]: 'The requested resource was not found',
};

// ============================================================================
// Custom Error Classes
// ============================================================================

export class OnrampError extends Error {
  constructor(
    public code: ErrorCode,
    message?: string,
    public details?: Record<string, any>
  ) {
    super(message || ErrorMessages[code]);
    this.name = 'OnrampError';
    Object.setPrototypeOf(this, OnrampError.prototype);
  }

  toJSON(): APIError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: new Date(),
    };
  }
}

export class RepositoryError extends OnrampError {
  constructor(code: ErrorCode, message?: string, details?: Record<string, any>) {
    super(code, message, details);
    this.name = 'RepositoryError';
  }
}

export class ValidationError extends OnrampError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.BAD_REQUEST, message, details);
    this.name = 'ValidationError';
  }
}

export class ServiceError extends OnrampError {
  constructor(code: ErrorCode, message?: string, details?: Record<string, any>) {
    super(code, message, details);
    this.name = 'ServiceError';
  }
}
