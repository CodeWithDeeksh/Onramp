/**
 * Redis Cache Store Client
 * Handles all caching operations using Redis
 */

import Redis from 'ioredis';
import type { ICacheStore } from '../types/interfaces.js';
import { ServiceError, ErrorCode } from '../types/errors.js';

export class CacheStore implements ICacheStore {
  private client: Redis;
  private defaultTTL: number;

  constructor(redisUrl?: string, defaultTTL = 3600) {
    this.defaultTTL = defaultTTL;

    try {
      this.client = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379', {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false,
      });

      this.client.on('error', (error) => {
        console.error('Redis connection error:', error);
      });

      this.client.on('connect', () => {
        console.log('Redis connected successfully');
      });
    } catch (error: any) {
      throw new ServiceError(
        ErrorCode.CACHE_ERROR,
        `Failed to initialize Redis client: ${error.message}`,
        { error: error.message }
      );
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);

      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error: any) {
      throw new ServiceError(ErrorCode.CACHE_ERROR, `Failed to get cache key ${key}`, {
        key,
        error: error.message,
      });
    }
  }

  /**
   * Set a value in cache with optional TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      const expirationTime = ttl || this.defaultTTL;

      if (expirationTime > 0) {
        await this.client.setex(key, expirationTime, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error: any) {
      throw new ServiceError(ErrorCode.CACHE_ERROR, `Failed to set cache key ${key}`, {
        key,
        error: error.message,
      });
    }
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error: any) {
      throw new ServiceError(ErrorCode.CACHE_ERROR, `Failed to delete cache key ${key}`, {
        key,
        error: error.message,
      });
    }
  }

  /**
   * Check if a key exists in cache
   */
  async has(key: string): Promise<boolean> {
    try {
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error: any) {
      throw new ServiceError(ErrorCode.CACHE_ERROR, `Failed to check cache key ${key}`, {
        key,
        error: error.message,
      });
    }
  }

  /**
   * Clear all keys matching a pattern
   */
  async clearPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.client.keys(pattern);

      if (keys.length === 0) {
        return 0;
      }

      await this.client.del(...keys);
      return keys.length;
    } catch (error: any) {
      throw new ServiceError(ErrorCode.CACHE_ERROR, `Failed to clear cache pattern ${pattern}`, {
        pattern,
        error: error.message,
      });
    }
  }

  /**
   * Get TTL for a key
   */
  async getTTL(key: string): Promise<number> {
    try {
      const ttl = await this.client.ttl(key);
      return ttl;
    } catch (error: any) {
      throw new ServiceError(ErrorCode.CACHE_ERROR, `Failed to get TTL for key ${key}`, {
        key,
        error: error.message,
      });
    }
  }

  /**
   * Set expiration time for a key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, seconds);
      return result === 1;
    } catch (error: any) {
      throw new ServiceError(ErrorCode.CACHE_ERROR, `Failed to set expiration for key ${key}`, {
        key,
        error: error.message,
      });
    }
  }

  /**
   * Increment a numeric value
   */
  async increment(key: string, amount = 1): Promise<number> {
    try {
      const result = await this.client.incrby(key, amount);
      return result;
    } catch (error: any) {
      throw new ServiceError(ErrorCode.CACHE_ERROR, `Failed to increment key ${key}`, {
        key,
        error: error.message,
      });
    }
  }

  /**
   * Get multiple keys at once
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (keys.length === 0) {
        return [];
      }

      const values = await this.client.mget(...keys);

      return values.map((value) => {
        if (!value) return null;
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error: any) {
      throw new ServiceError(ErrorCode.CACHE_ERROR, 'Failed to get multiple cache keys', {
        keys,
        error: error.message,
      });
    }
  }

  /**
   * Set multiple keys at once
   */
  async mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    try {
      if (entries.length === 0) {
        return;
      }

      // Use pipeline for better performance
      const pipeline = this.client.pipeline();

      for (const entry of entries) {
        const serialized = JSON.stringify(entry.value);
        const ttl = entry.ttl || this.defaultTTL;

        if (ttl > 0) {
          pipeline.setex(entry.key, ttl, serialized);
        } else {
          pipeline.set(entry.key, serialized);
        }
      }

      await pipeline.exec();
    } catch (error: any) {
      throw new ServiceError(ErrorCode.CACHE_ERROR, 'Failed to set multiple cache keys', {
        count: entries.length,
        error: error.message,
      });
    }
  }

  /**
   * Flush all data from cache (use with caution!)
   */
  async flush(): Promise<void> {
    try {
      await this.client.flushdb();
    } catch (error: any) {
      throw new ServiceError(ErrorCode.CACHE_ERROR, 'Failed to flush cache', {
        error: error.message,
      });
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    keys: number;
    memory: string;
    hits: number;
    misses: number;
  }> {
    try {
      const info = await this.client.info('stats');
      const dbsize = await this.client.dbsize();

      // Parse info string
      const stats = info.split('\r\n').reduce(
        (acc, line) => {
          const [key, value] = line.split(':');
          if (key && value) {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, string>
      );

      return {
        keys: dbsize,
        memory: stats.used_memory_human || '0',
        hits: parseInt(stats.keyspace_hits || '0'),
        misses: parseInt(stats.keyspace_misses || '0'),
      };
    } catch (error: any) {
      throw new ServiceError(ErrorCode.CACHE_ERROR, 'Failed to get cache stats', {
        error: error.message,
      });
    }
  }

  /**
   * Close the Redis connection
   */
  async close(): Promise<void> {
    try {
      await this.client.quit();
    } catch (error: any) {
      console.error('Error closing Redis connection:', error);
    }
  }

  /**
   * Check if Redis is connected
   */
  isConnected(): boolean {
    return this.client.status === 'ready';
  }
}
