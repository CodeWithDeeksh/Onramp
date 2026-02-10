/**
 * Redis Cache Store Client
 * Handles all caching operations using Redis
 */

// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import Redis from 'ioredis';
import type { ICacheStore } from '../types/interfaces.js';
import { ServiceError, ErrorCode } from '../types/errors.js';

export class CacheStore implements ICacheStore {
  private client: Redis | null;
  private defaultTTL: number;
  private memoryCache: Map<string, { value: string; expiry: number }>;
  private useMemoryFallback: boolean;

  constructor(redisUrl?: string, defaultTTL = 3600) {
    this.defaultTTL = defaultTTL;
    this.memoryCache = new Map();
    this.useMemoryFallback = false;
    this.client = null;

    try {
      this.client = new Redis(
        redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
        {
          retryStrategy: (times) => {
            if (times > 3) {
              console.warn('Redis unavailable, using in-memory cache fallback');
              this.useMemoryFallback = true;
              return null;
            }
            return Math.min(times * 50, 2000);
          },
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: false,
          connectTimeout: 5000,
        }
      );

      this.client.on('error', (error) => {
        console.error('Redis connection error:', error.message);
        this.useMemoryFallback = true;
      });

      this.client.on('connect', () => {
        console.log('Redis connected successfully');
        this.useMemoryFallback = false;
      });
    } catch (error: any) {
      console.warn('Redis initialization failed, using in-memory cache:', error.message);
      this.useMemoryFallback = true;
      this.client = null;
    }
  }

  /** Ensure Redis client exists */
  private ensureClient(): Redis {
    if (!this.client) {
      throw new ServiceError(
        ErrorCode.CACHE_ERROR,
        'Redis client not available'
      );
    }
    return this.client;
  }

  /** Get a value from cache */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.useMemoryFallback || !this.client) {
        const cached = this.memoryCache.get(key);
        if (!cached) return null;
        if (cached.expiry < Date.now()) {
          this.memoryCache.delete(key);
          return null;
        }
        return JSON.parse(cached.value) as T;
      }

      const value = await this.client.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch (error: any) {
      console.warn(`Cache get error for key ${key}, using memory fallback:`, error.message);
      this.useMemoryFallback = true;
      return null;
    }
  }

  /** Set a value in cache */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      const expirationTime = ttl || this.defaultTTL;

      if (this.useMemoryFallback || !this.client) {
        this.memoryCache.set(key, {
          value: serialized,
          expiry: Date.now() + expirationTime * 1000,
        });
        return;
      }

      if (expirationTime > 0) {
        await this.client.setex(key, expirationTime, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error: any) {
      console.warn(`Cache set error for key ${key}, using memory fallback:`, error.message);
      this.useMemoryFallback = true;
      this.memoryCache.set(key, {
        value: JSON.stringify(value),
        expiry: Date.now() + (ttl || this.defaultTTL) * 1000,
      });
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.ensureClient().del(key);
    } catch (error: any) {
      throw new ServiceError(ErrorCode.CACHE_ERROR, `Failed to delete cache key ${key}`, {
        key,
        error: error.message,
      });
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const exists = await this.ensureClient().exists(key);
      return exists === 1;
    } catch (error: any) {
      throw new ServiceError(ErrorCode.CACHE_ERROR, `Failed to check cache key ${key}`, {
        key,
        error: error.message,
      });
    }
  }

  async clearPattern(pattern: string): Promise<number> {
    try {
      const client = this.ensureClient();
      const keys = await client.keys(pattern);
      if (keys.length === 0) return 0;
      await client.del(...keys);
      return keys.length;
    } catch (error: any) {
      throw new ServiceError(ErrorCode.CACHE_ERROR, `Failed to clear cache pattern ${pattern}`, {
        pattern,
        error: error.message,
      });
    }
  }

  async getTTL(key: string): Promise<number> {
    try {
      return await this.ensureClient().ttl(key);
    } catch (error: any) {
      throw new ServiceError(ErrorCode.CACHE_ERROR, `Failed to get TTL for key ${key}`, {
        key,
        error: error.message,
      });
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      return (await this.ensureClient().expire(key, seconds)) === 1;
    } catch (error: any) {
      throw new ServiceError(ErrorCode.CACHE_ERROR, `Failed to set expiration for key ${key}`, {
        key,
        error: error.message,
      });
    }
  }

  async increment(key: string, amount = 1): Promise<number> {
    try {
      return await this.ensureClient().incrby(key, amount);
    } catch (error: any) {
      throw new ServiceError(ErrorCode.CACHE_ERROR, `Failed to increment key ${key}`, {
        key,
        error: error.message,
      });
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (keys.length === 0) return [];
      const values = await this.ensureClient().mget(...keys);

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

  async mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    try {
      if (entries.length === 0) return;

      const pipeline = this.ensureClient().pipeline();

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

  async flush(): Promise<void> {
    try {
      await this.ensureClient().flushdb();
    } catch (error: any) {
      throw new ServiceError(ErrorCode.CACHE_ERROR, 'Failed to flush cache', {
        error: error.message,
      });
    }
  }

  async getStats(): Promise<{ keys: number; memory: string; hits: number; misses: number }> {
    try {
      const client = this.ensureClient();
      const info = await client.info('stats');
      const dbsize = await client.dbsize();

      const stats = info.split('\r\n').reduce((acc, line) => {
        const [key, value] = line.split(':');
        if (key && value) acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

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

  async close(): Promise<void> {
    try {
      if (this.client) {
        await this.client.quit();
      }
    } catch (error: any) {
      console.error('Error closing Redis connection:', error);
    }
  }

  isConnected(): boolean {
    return !!this.client && this.client.status === 'ready';
  }
}

/** Singleton Redis instance - disabled to avoid connection issues */
export const redis = null;
