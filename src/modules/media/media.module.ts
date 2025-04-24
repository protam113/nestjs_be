import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { RedisCacheModule } from '../cache/redis-cache.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [RedisCacheModule, AuthModule],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
