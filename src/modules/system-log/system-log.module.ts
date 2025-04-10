import { Module } from '@nestjs/common';
import { SystemLogService } from './system-log.service';
import { SystemLogController } from './system-log.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SystemLog, SystemLogSchema } from '../../entities/system-log.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SystemLog.name, schema: SystemLogSchema },
    ]),
    AuthModule, // Import AuthModule to get access to JwtService and RolesGuard
  ],
  providers: [SystemLogService],
  controllers: [SystemLogController],
  exports: [SystemLogService],
})
export class SystemLogModule {}
