import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FaqController } from './faq.controller';
import { FaqService } from './faq.service';
import { FaqEntity, FaqSchema } from '../../entities/faq.entity';
import { SystemLogModule } from '../system-log/system-log.module';
import { RedisCacheModule } from '../cache/redis-cache.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: FaqEntity.name,
        schema: FaqSchema,
      },
    ]),
    AuthModule,
    SystemLogModule,
    RedisCacheModule,
  ],
  controllers: [FaqController],
  providers: [FaqService],
  exports: [FaqService],
})
export class FaqModule {}
