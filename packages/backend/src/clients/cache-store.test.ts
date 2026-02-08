/**
 * Unit tests for Cache Store
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CacheStore } from './cache-store.js';
import { ErrorCode } from '../types/errors.js';

// Mock ioredis
vi.mock('ioredis', () => {
  const mockSet = vi.fn();
  const mockSetex = vi.fn();
  
  return {
    default: vi.fn().mockImplementation(() => ({
      get: vi.fn(),
      set: mockSet,
      setex: mockSetex,
      del: vi.fn(),
      exists: vi.fn(),
      keys: vi.fn(),
      ttl: vi.fn(),
      expire: vi.fn(),
      incrby: vi.fn(),
      mget: vi.fn(),
      pipeline: vi.fn(() => ({
        setex: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([]),
      })),
      flushdb: vi.fn(),
      info: vi.fn(),
      dbsize: vi.fn(),
      quit: vi.fn(),
      on: vi.fn(),
      status: 'ready',
    })),
  };
});

describe('CacheStore', () => {
  let store: CacheStore;
  let mockRedis: any;

  beforeEach(() => {
    store = new CacheStore('redis://localhost:6379', 3600);
    mockRedis = (store as any).client;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('should retrieve and parse cached value', async () => {
      const testData = { name: 'test', value: 123 };
      mockRedis.get.mockResolvedValue(JSON.stringify(testData));

      const result = await store.get<typeof testData>('test-key');

      expect(result).toEqual(testData);
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null for non-existent key', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await store.get('nonexistent-key');

      expect(result).toBeNull();
    });

    it('should throw CACHE_ERROR on Redis error', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));

      await expect(store.get('test-key')).rejects.toMatchObject({
        code: ErrorCode.CACHE_ERROR,
      });
    });
  });

  describe('set', () => {
    it('should serialize and store value with TTL', async () => {
      const testData = { name: 'test', value: 123 };
      mockRedis.setex.mockResolvedValue('OK');

      await store.set('test-key', testData, 1800);

      expect(mockRedis.setex).toHaveBeenCalledWith('test-key', 1800, JSON.stringify(testData));
    });

    it('should use default TTL if not specified', async () => {
      const testData = { name: 'test' };
      mockRedis.setex.mockResolvedValue('OK');

      await store.set('test-key', testData);

      expect(mockRedis.setex).toHaveBeenCalledWith('test-key', 3600, JSON.stringify(testData));
    });
  });

  describe('delete', () => {
    it('should delete a key', async () => {
      mockRedis.del.mockResolvedValue(1);

      await store.delete('test-key');

      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    });
  });

  describe('has', () => {
    it('should return true if key exists', async () => {
      mockRedis.exists.mockResolvedValue(1);

      const result = await store.has('test-key');

      expect(result).toBe(true);
    });

    it('should return false if key does not exist', async () => {
      mockRedis.exists.mockResolvedValue(0);

      const result = await store.has('test-key');

      expect(result).toBe(false);
    });
  });

  describe('clearPattern', () => {
    it('should clear all keys matching pattern', async () => {
      mockRedis.keys.mockResolvedValue(['key1', 'key2', 'key3']);
      mockRedis.del.mockResolvedValue(3);

      const result = await store.clearPattern('test:*');

      expect(result).toBe(3);
      expect(mockRedis.keys).toHaveBeenCalledWith('test:*');
      expect(mockRedis.del).toHaveBeenCalledWith('key1', 'key2', 'key3');
    });

    it('should return 0 if no keys match', async () => {
      mockRedis.keys.mockResolvedValue([]);

      const result = await store.clearPattern('test:*');

      expect(result).toBe(0);
      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });

  describe('getTTL', () => {
    it('should return TTL for a key', async () => {
      mockRedis.ttl.mockResolvedValue(1800);

      const result = await store.getTTL('test-key');

      expect(result).toBe(1800);
    });
  });

  describe('increment', () => {
    it('should increment a numeric value', async () => {
      mockRedis.incrby.mockResolvedValue(5);

      const result = await store.increment('counter', 2);

      expect(result).toBe(5);
      expect(mockRedis.incrby).toHaveBeenCalledWith('counter', 2);
    });
  });

  describe('mget', () => {
    it('should retrieve multiple keys', async () => {
      const data1 = { id: 1 };
      const data2 = { id: 2 };

      mockRedis.mget.mockResolvedValue([JSON.stringify(data1), JSON.stringify(data2), null]);

      const result = await store.mget<{ id: number }>(['key1', 'key2', 'key3']);

      expect(result).toEqual([data1, data2, null]);
    });

    it('should return empty array for empty keys', async () => {
      const result = await store.mget([]);

      expect(result).toEqual([]);
      expect(mockRedis.mget).not.toHaveBeenCalled();
    });
  });

  describe('isConnected', () => {
    it('should return true when Redis is connected', () => {
      mockRedis.status = 'ready';

      const result = store.isConnected();

      expect(result).toBe(true);
    });

    it('should return false when Redis is not connected', () => {
      mockRedis.status = 'disconnected';

      const result = store.isConnected();

      expect(result).toBe(false);
    });
  });
});
