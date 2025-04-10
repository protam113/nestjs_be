import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SystemLogModule } from '../system-log/system-log.module';
import { SlugProvider } from '../slug/slug.provider';
import { ServiceEntity, ServiceSchema } from 'src/entities/service.entity';
import { ServiceService } from './service.service';
import { ServiceController } from './service.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServiceEntity.name, schema: ServiceSchema },
    ]),
    SystemLogModule,
  ],
  controllers: [ServiceController],
  providers: [ServiceService, SlugProvider],
  exports: [ServiceService],
})
export class ServiceModule {}
