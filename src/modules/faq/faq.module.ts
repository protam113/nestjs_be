import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FaqController } from './faq.controller';
import { FaqService } from './faq.service';
import { FaqEntity, FaqSchema } from '../../entities/faq.entity';
import { SystemLogModule } from '../system-log/system-log.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: FaqEntity.name,
        schema: FaqSchema,
      },
    ]),
    SystemLogModule,
  ],
  controllers: [FaqController],
  providers: [FaqService],
  exports: [FaqService],
})
export class FaqModule {}
