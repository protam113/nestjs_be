import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContactEntity, ContactSchema } from '../../entities/contact.entity';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { EmailModule } from '../../common/email/email.module';
import { SystemLogModule } from '../system-log/system-log.module';
import { RedisCacheModule } from '../cache/redis-cache.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ContactEntity.name, schema: ContactSchema },
    ]),
    RedisCacheModule,
    EmailModule,
    SystemLogModule,
  ],
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}
