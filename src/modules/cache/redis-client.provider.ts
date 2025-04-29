// redis-client.provider.ts
import { Injectable, Provider } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisClientProvider {
  private redisClient: Redis;

  constructor(private readonly configService: ConfigService) {}

  createRedisClient(): Redis {
    if (!this.redisClient) {
      const redisHost = this.configService.get('REDIS_HOST', 'redis');
      const redisPort = this.configService.get('REDIS_PORT', 6379);
      const redisPassword = this.configService.get('REDIS_PASSWORD');
      const redisDb = this.configService.get('REDIS_INDEX', 0);

      this.redisClient = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword,
        db: redisDb,
      });

      console.log(
        `Redis Client connected to ${redisHost}:${redisPort}, DB: ${redisDb}`
      );

      this.redisClient.on('connect', () => {
        console.log('Successfully connected to Redis!');
      });

      this.redisClient.on('error', (err) => {
        console.error('Redis connection error:', err);
      });
    }

    return this.redisClient;
  }
}

export const redisClientProvider: Provider = {
  provide: 'REDIS_CLIENT',
  useFactory: (configService: ConfigService) => {
    const redisHost = configService.get('REDIS_HOST', 'redis');
    const redisPort = configService.get('REDIS_PORT', 6379);
    const redisPassword = configService.get('REDIS_PASSWORD');
    const redisDb = configService.get('REDIS_INDEX', 0);

    const redisClient = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword,
      db: redisDb,
    });

    console.log(
      `Redis Client connected to ${redisHost}:${redisPort}, DB: ${redisDb}`
    );

    redisClient.on('connect', () => {
      console.log('Successfully connected to Redis!');
    });

    // Log lỗi khi kết nối gặp sự cố
    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    return redisClient;
  },
  inject: [ConfigService],
};
