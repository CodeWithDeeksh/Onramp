/**
 * Request ID Middleware
 * Generates unique request IDs for tracking requests through the system
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Adds a unique request ID to each request
 * Uses existing X-Request-ID header if present, otherwise generates a new UUID
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Use existing request ID from header or generate new one
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();

  // Attach to request object
  (req as any).id = requestId;

  // Add to response headers
  res.setHeader('X-Request-ID', requestId);

  next();
}
