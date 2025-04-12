import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User, UserSchema } from '../../entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { SystemLogModule } from '../system-log/system-log.module';
import { RedisCacheModule } from '../cache/redis-cache.module';
import { EmailPasswordModule } from 'src/common/email/password_email.module';
import { EmailPasswordService } from 'src/services/email_password.service';
import { EmailRegisterModule } from 'src/common/email/register_email.module';
import { EmailRegisterService } from 'src/services/email_register.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    AuthModule,
    SystemLogModule,
    EmailPasswordModule,
    EmailRegisterModule,
    RedisCacheModule,
  ],
  controllers: [UserController],
  providers: [UserService, EmailPasswordService, EmailRegisterService],
  exports: [UserService],
})
export class UserModule {}
