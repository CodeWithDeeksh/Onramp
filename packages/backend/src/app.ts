/**
 * Express Application Setup
 * Configures middleware and routes for the Onramp API
 */

import express, { Application } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger.js';
import { errorHandler, notFoundHandler, requestIdMiddleware } from './middleware/index.js';
import { createRepositoryRouter } from './routes/repository.routes.js';
import { createUserRouter } from './routes/user.routes.js';
import { createRecommendationRouter } from './routes/recommendation.routes.js';
import { createGuidanceRouter } from './routes/guidance.routes.js';
import { createIssueRouter } from './routes/issue.routes.js';
import { createHealthRouter } from './routes/health.routes.js';

/**
 * Creates and configures the Express application
 */
export function createApp(): Application {
  const app = express();

  // ============================================================================
  // Middleware Setup
  // ============================================================================

  // Request ID tracking
  app.use(requestIdMiddleware);

  // Request logging with Pino
  app.use(
    pinoHttp({
      logger,
      autoLogging: true,
      customLogLevel: (req, res, err) => {
        if (res.statusCode >= 500 || err) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    })
  );

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later',
        timestamp: new Date(),
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api/', limiter);

  // ============================================================================
  // Routes
  // ============================================================================

  // Health check endpoint
  app.use('/api/health', createHealthRouter());

  // API routes
  app.use('/api/repositories', createRepositoryRouter());
  app.use('/api/users', createUserRouter());
  app.use('/api/recommendations', createRecommendationRouter());
  app.use('/api/guidance', createGuidanceRouter());
  app.use('/api/issues', createIssueRouter());

  // ============================================================================
  // Error Handling
  // ============================================================================

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
}
