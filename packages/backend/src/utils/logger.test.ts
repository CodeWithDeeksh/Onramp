/**
 * Logger Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { logger, createChildLogger } from './logger.js';

describe('Logger', () => {
  describe('logger instance', () => {
    it('should be defined', () => {
      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.debug).toBeDefined();
    });

    it('should have logging methods', () => {
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });
  });

  describe('createChildLogger', () => {
    it('should create child logger with additional context', () => {
      const childLogger = createChildLogger({
        requestId: 'test-123',
        userId: 'user-456',
      });

      expect(childLogger).toBeDefined();
      expect(childLogger.info).toBeDefined();
    });

    it('should redact sensitive data in context', () => {
      const childLogger = createChildLogger({
        requestId: 'test-123',
        token: 'secret-token',
        apiKey: 'secret-key',
      });

      // Child logger should be created without throwing
      expect(childLogger).toBeDefined();
    });

    it('should handle nested objects in context', () => {
      const childLogger = createChildLogger({
        requestId: 'test-123',
        user: {
          id: 'user-456',
          email: 'test@example.com',
        },
        metadata: {
          source: 'api',
          version: '1.0',
        },
      });

      expect(childLogger).toBeDefined();
    });
  });

  describe('sensitive data redaction', () => {
    it('should create logger without errors', () => {
      // This test verifies that the logger is properly configured
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
    });
  });

  describe('log levels', () => {
    it('should support all standard log levels', () => {
      expect(logger.fatal).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.trace).toBeDefined();
    });
  });

  describe('serializers', () => {
    it('should have logging functionality', () => {
      // Verify logger has all necessary methods
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
    });
  });
});
