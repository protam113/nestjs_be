import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SystemLogModule } from '../system-log/system-log.module';
import { CategoryModule } from '../category/category.module';
import { SlugProvider } from '../slug/slug.provider';
import { BlogEntity, BlogSchema } from '../../entities/blog.entity';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { RedisCacheModule } from '../cache/redis-cache.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: BlogEntity.name, schema: BlogSchema }]),
    SystemLogModule,
    RedisCacheModule,
    CategoryModule,
  ],
  controllers: [BlogController],
  providers: [BlogService, SlugProvider],
  exports: [BlogService],
})
export class BlogModule {}
