/**
 * Health Check Routes
 * Provides health status endpoint for monitoring
 */

import { Router, Request, Response } from 'express';
import { checkDatabaseConnection } from '../utils/prisma.js';
import { redis } from '../clients/cache-store.js';

export function createHealthRouter(): Router {
  const router = Router();

  /**
   * GET /api/health
   * Returns health status of the service with dependency checks
   */
  router.get('/', async (req: Request, res: Response) => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'unknown',
        cache: 'unknown',
      },
    };

    try {
      // Check database connection
      const dbHealthy = await checkDatabaseConnection();
      health.services.database = dbHealthy ? 'connected' : 'disconnected';

      // Check Redis connection
      try {
        await redis.ping();
        health.services.cache = 'connected';
      } catch {
        health.services.cache = 'disconnected';
      }

      // If any service is down, return 503
      const allHealthy =
        health.services.database === 'connected' &&
        health.services.cache === 'connected';

      res.status(allHealthy ? 200 : 503).json(health);
    } catch (error) {
      health.status = 'unhealthy';
      res.status(503).json(health);
    }
  });

  return router;
}
