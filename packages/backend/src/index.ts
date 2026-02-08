/**
 * Onramp Backend Entry Point
 * Starts the Express server with optimized configuration
 */

import { createApp } from './app.js';
import { logger } from './utils/logger.js';
import { prisma } from './utils/prisma.js';
import { redis } from './clients/cache-store.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Create and start the server
const app = createApp();

const server = app.listen(PORT, HOST, () => {
  logger.info(
    {
      port: PORT,
      host: HOST,
      environment: process.env.NODE_ENV || 'development',
    },
    'Server started successfully'
  );
});

// Graceful shutdown handler
async function gracefulShutdown(signal: string) {
  logger.info(`${signal} signal received: starting graceful shutdown`);
  
  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');
    
    try {
      // Close database connections
      await prisma.$disconnect();
      logger.info('Database connections closed');
      
      // Close Redis connections
      await redis.quit();
      logger.info('Redis connections closed');
      
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during graceful shutdown');
      process.exit(1);
    }
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught exception');
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled rejection');
  gracefulShutdown('UNHANDLED_REJECTION');
});

export { app };
