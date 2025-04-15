import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeoController } from './seo.controller';
import { SeoService } from './seo.service';
import { SeoEntity, SeoSchema } from '../../entities/seo.entity';
import { AuthModule } from '../auth/auth.module';
import { RedisCacheModule } from '../cache/redis-cache.module';
import { SystemLogModule } from '../system-log/system-log.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SeoEntity.name, schema: SeoSchema }]),
    AuthModule,
    RedisCacheModule,
    SystemLogModule,
  ],
  controllers: [SeoController],
  providers: [SeoService],
  exports: [SeoService],
})
export class SeoModule implements OnModuleInit {
  constructor(private readonly seoService: SeoService) {}

  async onModuleInit() {
    await this.seoService.initializeDefaultSeo();
  }
}
