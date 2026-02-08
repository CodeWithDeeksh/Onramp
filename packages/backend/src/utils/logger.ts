/**
 * Structured Logging System
 * Configures Pino logger with request ID tracking and sensitive data redaction
 */

import pino from 'pino';

/**
 * Sensitive field patterns to redact from logs
 */
const SENSITIVE_PATTERNS = [
  'password',
  'token',
  'apiKey',
  'api_key',
  'authorization',
  'secret',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
];

/**
 * Custom serializers for structured logging
 */
const serializers = {
  // Serialize errors with stack traces
  err: pino.stdSerializers.err,

  // Serialize request objects
  req: (req: any) => ({
    id: req.id,
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    headers: redactSensitiveData(req.headers),
    remoteAddress: req.ip || req.connection?.remoteAddress,
  }),

  // Serialize response objects
  res: (res: any) => ({
    statusCode: res.statusCode,
    headers: redactSensitiveData(res.getHeaders?.()),
  }),
};

/**
 * Redacts sensitive data from objects
 */
function redactSensitiveData(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const redacted = { ...obj };

  for (const key in redacted) {
    const lowerKey = key.toLowerCase();

    // Check if key matches sensitive patterns
    if (SENSITIVE_PATTERNS.some((pattern) => lowerKey.includes(pattern))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      // Recursively redact nested objects
      redacted[key] = redactSensitiveData(redacted[key]);
    }
  }

  return redacted;
}

/**
 * Create logger instance with environment-specific configuration
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  
  // Use pretty printing in development
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,

  // Custom serializers
  serializers,

  // Base fields included in all logs
  base: {
    service: 'onramp-backend',
    environment: process.env.NODE_ENV || 'development',
  },

  // Format timestamps
  timestamp: pino.stdTimeFunctions.isoTime,

  // Redact sensitive fields
  redact: {
    paths: SENSITIVE_PATTERNS.map((pattern) => `*.${pattern}`),
    censor: '[REDACTED]',
  },
});

/**
 * Create child logger with additional context
 */
export function createChildLogger(context: Record<string, any>) {
  return logger.child(redactSensitiveData(context));
}

/**
 * Log levels:
 * - fatal: Application is unusable
 * - error: Error events that might still allow the application to continue
 * - warn: Warning events (e.g., rate limit warnings, cache misses)
 * - info: Informational messages (e.g., request/response logging)
 * - debug: Detailed debugging information
 * - trace: Very detailed debugging information
 */
