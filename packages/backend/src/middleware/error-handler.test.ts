/**
 * Error Handler Middleware Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { errorHandler, notFoundHandler } from './error-handler.js';
import {
  OnrampError,
  ErrorCode,
  ValidationError,
  RepositoryError,
  ServiceError,
} from '../types/errors.js';
import { ZodError } from 'zod';

// Mock logger
vi.mock('../utils/logger.js', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      id: 'test-request-id',
      path: '/api/test',
      method: 'GET',
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = vi.fn();
  });

  describe('OnrampError handling', () => {
    it('should handle INVALID_REPOSITORY_URL with 400 status', () => {
      const error = new OnrampError(
        ErrorCode.INVALID_REPOSITORY_URL,
        'Invalid URL format'
      );

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ErrorCode.INVALID_REPOSITORY_URL,
          message: 'Invalid URL format',
        })
      );
    });

    it('should handle REPOSITORY_NOT_FOUND with 404 status', () => {
      const error = new RepositoryError(
        ErrorCode.REPOSITORY_NOT_FOUND,
        'Repository does not exist'
      );

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ErrorCode.REPOSITORY_NOT_FOUND,
          message: 'Repository does not exist',
        })
      );
    });

    it('should handle RATE_LIMIT_EXCEEDED with 429 status', () => {
      const error = new OnrampError(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        'Rate limit exceeded',
        { resetTime: '2024-01-01T00:00:00Z' }
      );

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(429);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ErrorCode.RATE_LIMIT_EXCEEDED,
          details: { resetTime: '2024-01-01T00:00:00Z' },
        })
      );
    });

    it('should handle LLM_SERVICE_UNAVAILABLE with 502 status', () => {
      const error = new ServiceError(
        ErrorCode.LLM_SERVICE_UNAVAILABLE,
        'LLM service timeout'
      );

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(502);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ErrorCode.LLM_SERVICE_UNAVAILABLE,
        })
      );
    });

    it('should handle ANALYSIS_TIMEOUT with 504 status', () => {
      const error = new OnrampError(ErrorCode.ANALYSIS_TIMEOUT);

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(504);
    });

    it('should handle CACHE_ERROR with 500 status', () => {
      const error = new ServiceError(ErrorCode.CACHE_ERROR, 'Redis connection failed');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it('should handle DATABASE_ERROR with 500 status', () => {
      const error = new ServiceError(
        ErrorCode.DATABASE_ERROR,
        'PostgreSQL query failed'
      );

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe('Zod validation error handling', () => {
    it('should handle ZodError with 400 status', () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['url'],
          message: 'Expected string, received number',
        },
        {
          code: 'too_small',
          minimum: 1,
          type: 'array',
          inclusive: true,
          exact: false,
          path: ['languages'],
          message: 'Array must contain at least 1 element(s)',
        },
      ]);

      errorHandler(
        zodError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ErrorCode.BAD_REQUEST,
          message: 'Validation failed',
          details: {
            errors: [
              {
                path: 'url',
                message: 'Expected string, received number',
              },
              {
                path: 'languages',
                message: 'Array must contain at least 1 element(s)',
              },
            ],
          },
        })
      );
    });
  });

  describe('Unexpected error handling', () => {
    it('should handle generic Error with 500 status', () => {
      const error = new Error('Unexpected error occurred');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'An unexpected error occurred',
        })
      );
    });

    it('should include timestamp in error response', () => {
      const error = new OnrampError(ErrorCode.BAD_REQUEST);

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(Date),
        })
      );
    });
  });

  describe('Error details handling', () => {
    it('should include error details in response', () => {
      const error = new OnrampError(ErrorCode.INVALID_USER_PROFILE, 'Invalid profile', {
        field: 'experienceLevel',
        value: 'expert',
        expected: ['beginner', 'intermediate', 'advanced'],
      });

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          details: {
            field: 'experienceLevel',
            value: 'expert',
            expected: ['beginner', 'intermediate', 'advanced'],
          },
        })
      );
    });
  });
});

describe('Not Found Handler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      id: 'test-request-id',
      path: '/api/nonexistent',
      method: 'POST',
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
  });

  it('should return 404 for non-existent routes', () => {
    notFoundHandler(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        code: ErrorCode.NOT_FOUND,
        message: 'Route POST /api/nonexistent not found',
      })
    );
  });

  it('should include request method and path in error message', () => {
    mockRequest.method = 'DELETE';
    mockRequest.path = '/api/users/123';

    notFoundHandler(mockRequest as Request, mockResponse as Response);

    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Route DELETE /api/users/123 not found',
      })
    );
  });
});
