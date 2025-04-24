import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisCacheService } from './redis-cache.service';

@Module({
  imports: [
    // Đảm bảo CacheModule được cấu hình chính xác
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: require('cache-manager-ioredis'), // Dùng store của ioredis
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASSWORD', ''),
        ttl: 60 * 60 * 24, // Thời gian sống của cache (TTL)
        retryStrategy: (times: number) => Math.min(times * 50, 2000), // Chiến lược retry khi Redis không sẵn sàng
      }),
    }),
  ],
  providers: [RedisCacheService], // Dịch vụ cache Redis của bạn
  exports: [RedisCacheService], // Export để các module khác có thể sử dụng
})
export class RedisCacheModule {}
