import { Module } from '@nestjs/common';
import { EmailRegisterService } from 'src/services/email_register.service';

@Module({
  providers: [EmailRegisterService],
  exports: [EmailRegisterService],
})
export class EmailRegisterModule {}
