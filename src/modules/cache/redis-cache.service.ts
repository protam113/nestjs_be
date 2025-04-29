import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Inject,
} from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  onModuleInit() {
    this.redisClient.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });
    this.redisClient.on('error', (error) => {
      this.logger.error('[Redis] Connection error:', error);
    });
    this.redisClient.on('reconnecting', () => {
      this.logger.warn('[Redis] Reconnecting...');
    });
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.logger.log('Redis client connection closed');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redisClient.get(key);
      if (raw) {
        this.logger.log(`Cache HIT for key: ${key}`);
        return JSON.parse(raw) as T;
      } else {
        this.logger.warn(`Cache MISS for key: ${key}`);
        return null;
      }
    } catch (error) {
      this.logger.error('Error getting value from Redis', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = 60): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      await this.redisClient.set(key, stringValue, 'EX', ttl);
      this.logger.log(`Cache SET for key: ${key} with TTL: ${ttl}s`);
    } catch (error) {
      this.logger.error('Error setting value to Redis', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
      this.logger.log(`Cache DEL for key: ${key}`);
    } catch (error) {
      this.logger.error('Error deleting key from Redis', error);
    }
  }

  async reset(): Promise<void> {
    try {
      await this.redisClient.flushall();
      this.logger.log('Redis cache flushed');
    } catch (error) {
      this.logger.error('Error flushing Redis cache', error);
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redisClient.keys(pattern);
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
        this.logger.log(
          `Deleted ${keys.length} keys with pattern '${pattern}'`
        );
      }
    } catch (error) {
      this.logger.error('Error deleting keys by pattern', error);
    }
  }
}
