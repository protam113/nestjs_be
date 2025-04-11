import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CategoryEntity, CategorySchema } from '../../entities/category.entity';
import { SlugProvider } from '../slug/slug.provider';
import { SystemLogModule } from '../system-log/system-log.module';
import { RedisCacheModule } from '../cache/redis-cache.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CategoryEntity.name, schema: CategorySchema },
    ]),
    SystemLogModule,
    RedisCacheModule,
  ],
  controllers: [CategoryController],
  providers: [CategoryService, SlugProvider],
  exports: [CategoryService],
})
export class CategoryModule {}
