// redis-client.provider.ts
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Use require if you're getting issues with import
const Redis = require('ioredis');

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const redisClientProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: async (configService: ConfigService) => {
    const client = new Redis({
      host: configService.get('REDIS_HOST', 'localhost'),
      port: configService.get('REDIS_PORT', 6379),
      password: configService.get('REDIS_PASSWORD', ''),
    });
    return client;
  },
  inject: [ConfigService], // Inject ConfigService into the factory function
};
