import { Module } from '@nestjs/common';
import { EmailPasswordService } from 'src/services/email_password.service';

@Module({
  providers: [EmailPasswordService],
  exports: [EmailPasswordService],
})
export class EmailPasswordModule {}
