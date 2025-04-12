import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PricingEntity, PricingSchema } from '../../entities/pricing.entity';
import { SlugProvider } from '../slug/slug.provider';
import { SystemLogModule } from '../system-log/system-log.module';
import { RedisCacheModule } from '../cache/redis-cache.module';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PricingEntity.name, schema: PricingSchema },
    ]),
    SystemLogModule,
    RedisCacheModule,
  ],
  controllers: [PricingController],
  providers: [PricingService, SlugProvider],
  exports: [PricingService],
})
export class PricingModule {}
