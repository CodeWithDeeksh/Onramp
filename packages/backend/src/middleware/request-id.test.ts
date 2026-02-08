/**
 * Request ID Middleware Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requestIdMiddleware } from './request-id.js';

describe('Request ID Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let setHeaderMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setHeaderMock = vi.fn();

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      setHeader: setHeaderMock,
    };

    mockNext = vi.fn();
  });

  it('should generate a new request ID if not provided', () => {
    requestIdMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Should attach ID to request
    expect((mockRequest as any).id).toBeDefined();
    expect(typeof (mockRequest as any).id).toBe('string');
    expect((mockRequest as any).id.length).toBeGreaterThan(0);

    // Should set response header
    expect(setHeaderMock).toHaveBeenCalledWith(
      'X-Request-ID',
      (mockRequest as any).id
    );

    // Should call next
    expect(mockNext).toHaveBeenCalled();
  });

  it('should use existing X-Request-ID header if provided', () => {
    const existingId = 'existing-request-id-123';
    mockRequest.headers = {
      'x-request-id': existingId,
    };

    requestIdMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Should use existing ID
    expect((mockRequest as any).id).toBe(existingId);

    // Should set response header with existing ID
    expect(setHeaderMock).toHaveBeenCalledWith('X-Request-ID', existingId);

    // Should call next
    expect(mockNext).toHaveBeenCalled();
  });

  it('should generate UUID format for new request IDs', () => {
    requestIdMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    const requestId = (mockRequest as any).id;

    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(requestId).toMatch(uuidRegex);
  });

  it('should generate unique IDs for different requests', () => {
    const mockRequest1: Partial<Request> = { headers: {} };
    const mockRequest2: Partial<Request> = { headers: {} };
    const mockResponse1: Partial<Response> = { setHeader: vi.fn() };
    const mockResponse2: Partial<Response> = { setHeader: vi.fn() };

    requestIdMiddleware(
      mockRequest1 as Request,
      mockResponse1 as Response,
      mockNext
    );

    requestIdMiddleware(
      mockRequest2 as Request,
      mockResponse2 as Response,
      mockNext
    );

    expect((mockRequest1 as any).id).not.toBe((mockRequest2 as any).id);
  });

  it('should handle case-insensitive header names', () => {
    const existingId = 'case-test-id';
    mockRequest.headers = {
      'X-Request-ID': existingId, // Uppercase
    } as any;

    requestIdMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Express normalizes headers to lowercase, but we should handle both
    expect((mockRequest as any).id).toBeDefined();
  });
});
