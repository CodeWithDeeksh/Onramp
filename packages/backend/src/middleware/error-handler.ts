/**
 * Error Handling Middleware
 * Centralized error handler for Express that maps service errors to HTTP responses
 */

import { Request, Response, NextFunction } from 'express';
import { OnrampError, ErrorCode, ValidationError } from '../types/errors.js';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

/**
 * Maps error codes to HTTP status codes
 */
const errorCodeToHttpStatus: Record<ErrorCode, number> = {
  [ErrorCode.INVALID_REPOSITORY_URL]: 400,
  [ErrorCode.REPOSITORY_NOT_FOUND]: 404,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.LLM_SERVICE_UNAVAILABLE]: 502,
  [ErrorCode.ANALYSIS_TIMEOUT]: 504,
  [ErrorCode.INVALID_USER_PROFILE]: 400,
  [ErrorCode.CACHE_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
};

/**
 * Error handling middleware
 * Catches all errors and formats them into consistent HTTP responses
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationError = new ValidationError('Validation failed', {
      errors: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });

    logger.warn(
      {
        err: validationError,
        requestId: req.id,
        path: req.path,
        method: req.method,
      },
      'Validation error'
    );

    res.status(400).json(validationError.toJSON());
    return;
  }

  // Handle OnrampError and its subclasses
  if (err instanceof OnrampError) {
    const statusCode = errorCodeToHttpStatus[err.code] || 500;

    // Log based on severity
    if (statusCode >= 500) {
      logger.error(
        {
          err,
          requestId: req.id,
          path: req.path,
          method: req.method,
          userId: (req as any).userId,
        },
        'Server error'
      );
    } else {
      logger.warn(
        {
          err,
          requestId: req.id,
          path: req.path,
          method: req.method,
        },
        'Client error'
      );
    }

    res.status(statusCode).json(err.toJSON());
    return;
  }

  // Handle unexpected errors
  logger.error(
    {
      err,
      requestId: req.id,
      path: req.path,
      method: req.method,
      userId: (req as any).userId,
    },
    'Unexpected error'
  );

  const internalError = new OnrampError(
    ErrorCode.INTERNAL_SERVER_ERROR,
    'An unexpected error occurred'
  );

  res.status(500).json(internalError.toJSON());
}

/**
 * 404 Not Found handler
 * Handles requests to non-existent routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  const error = new OnrampError(
    ErrorCode.NOT_FOUND,
    `Route ${req.method} ${req.path} not found`
  );

  logger.warn(
    {
      requestId: req.id,
      path: req.path,
      method: req.method,
    },
    'Route not found'
  );

  res.status(404).json(error.toJSON());
}
