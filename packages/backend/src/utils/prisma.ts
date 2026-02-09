/**
 * Prisma Client Singleton with Connection Pooling
 * Ensures a single Prisma instance is used across the application
 */

// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

// Prisma client options for production optimization
const prismaOptions = {
  log: [
    { level: 'warn' as const, emit: 'event' as const },
    { level: 'error' as const, emit: 'event' as const },
  ],
  // Connection pool settings
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};

// Create Prisma client singleton
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Log Prisma warnings and errors
prisma.$on('warn' as never, (e: any) => {
  logger.warn({ prisma: e }, 'Prisma warning');
});

prisma.$on('error' as never, (e: any) => {
  logger.error({ prisma: e }, 'Prisma error');
});

// Query performance monitoring in development
if (process.env.NODE_ENV === 'development') {
  prisma.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    const duration = after - before;

    // Log slow queries (> 1000ms)
    if (duration > 1000) {
      logger.warn(
        {
          model: params.model,
          action: params.action,
          duration: `${duration}ms`,
        },
        'Slow query detected'
      );
    }

    return result;
  });
}

// Health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error({ error }, 'Database connection check failed');
    return false;
  }
}
