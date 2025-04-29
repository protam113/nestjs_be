import { Module } from '@nestjs/common';
import { RedisCacheService } from './redis-cache.service';
import { redisClientProvider } from './redis-client.provider';

@Module({
  providers: [RedisCacheService, redisClientProvider],
  exports: [RedisCacheService, redisClientProvider],
})
export class RedisCacheModule {}
