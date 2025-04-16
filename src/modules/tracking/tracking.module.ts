import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisCacheModule } from '../cache/redis-cache.module';
import { AuthModule } from '../auth/auth.module';
import { TrackingEntity, TrackingSchema } from 'src/entities/tracking.entity';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { BlogModule } from '../blog/blog.module';
import { ServiceModule } from '../service/service.module';
import { ProjectModule } from '../project/project.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TrackingEntity.name, schema: TrackingSchema },
    ]),
    RedisCacheModule,
    AuthModule,
    BlogModule,
    ServiceModule,
    ProjectModule,
  ],
  controllers: [TrackingController],
  providers: [TrackingService],
  exports: [TrackingService],
})
export class TrackingModule {}
