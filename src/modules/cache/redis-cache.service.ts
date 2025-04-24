import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Redis } from 'ioredis';

@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);
  private redisClient: Redis;

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {
    // Lấy store từ cache-manager (cache-manager-ioredis)
    const cacheManager = this.cache['stores'][0]; // Truy cập trực tiếp vào store Redis

    // Kiểm tra xem cacheManager có hỗ trợ Redis không
    if (cacheManager && cacheManager.store && cacheManager.store.client) {
      this.redisClient = cacheManager.store.client;
    }

    // Kiểm tra Redis client
    if (!this.redisClient) {
      this.logger.warn(
        'Redis client not available. Pattern-based deletion will not work.'
      );
    } else {
      this.logger.log('Redis client initialized successfully');
    }
  }

  // Kiểm tra lại Redis Client khi khởi tạo module
  async onModuleInit() {
    if (this.redisClient) {
      this.logger.log('Redis client is available');
    } else {
      this.logger.warn('Redis client is not available');
    }
  }

  // Lấy giá trị từ Redis cache
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cache.get<T>(key);
      return value || null;
    } catch (error) {
      this.logger.error('Error getting value from Redis', error);
      return null;
    }
  }

  // Lưu giá trị vào Redis cache
  async set(key: string, value: any, ttl: number = 60): Promise<void> {
    try {
      await this.cache.set(key, value, ttl); // Set TTL cho cache
    } catch (error) {
      this.logger.error('Error setting value to Redis', error);
    }
  }

  // Xóa giá trị trong Redis cache
  async del(key: string): Promise<void> {
    try {
      await this.cache.del(key);
    } catch (error) {
      this.logger.error('Error deleting value from Redis', error);
    }
  }

  // Reset tất cả dữ liệu trong Redis
  async reset(): Promise<void> {
    try {
      await this.redisClient.flushall(); // Xóa tất cả dữ liệu trong Redis
    } catch (error) {
      this.logger.error('Error resetting Redis cache', error);
    }
  }

  // Xóa cache theo pattern
  async delByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redisClient.keys(pattern); // Lấy tất cả keys theo pattern
      if (keys.length > 0) {
        await this.redisClient.del(keys); // Xóa các keys theo pattern
        this.logger.log(
          `Deleted ${keys.length} keys with pattern '${pattern}'`
        );
      }
    } catch (error) {
      this.logger.error('Error deleting keys by pattern', error);
    }
  }
}
