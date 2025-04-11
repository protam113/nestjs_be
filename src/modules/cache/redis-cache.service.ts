import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Redis } from 'ioredis';

@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);
  private redisClient: Redis;

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {
    // Get the Redis client from the cache manager
    const store = this.cache.store;
    this.redisClient = (store as any).client as Redis;

    // Ensure we have a Redis client
    if (!this.redisClient) {
      this.logger.warn(
        'Redis client not available. Pattern-based deletion will not work.'
      );
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    const result = await this.cache.get<T>(key);
    return result || undefined;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cache.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cache.del(key);
  }

  async reset(): Promise<void> {
    await this.cache.reset();
  }

  async delPrefix(prefix: string): Promise<void> {
    if (!this.redisClient) {
      this.logger.warn(
        `Cannot delete by prefix '${prefix}': Redis client not available`
      );
      return;
    }

    try {
      const keys = await this.redisClient.keys(`${prefix}*`);
      if (keys.length > 0) {
        await this.redisClient.del(keys);
        this.logger.log(`Deleted ${keys.length} keys with prefix '${prefix}'`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete keys with prefix '${prefix}'`, error);
    }
  }
}
