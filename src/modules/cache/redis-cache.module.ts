import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisCacheService } from './redis-cache.service';
import { redisClientProvider } from './redis-client.provider';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisStore = require('cache-manager-ioredis');
        return {
          store: redisStore,
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD', ''),
          ttl: 60 * 60 * 24, // Thời gian sống của cache: 24 giờ
          retryStrategy: (times: number) => Math.min(times * 50, 2000), // Chiến lược retry khi kết nối Redis
        };
      },
    }),
  ],
  providers: [RedisCacheService, redisClientProvider], // Provider cho Redis client
  exports: [RedisCacheService], // Export RedisCacheService để sử dụng ở các module khác
})
export class RedisCacheModule {}
