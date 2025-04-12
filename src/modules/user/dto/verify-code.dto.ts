import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyCodeDto {
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, {
    message: 'Verification code must be exactly 6 characters long',
  })
  code: string;
}
