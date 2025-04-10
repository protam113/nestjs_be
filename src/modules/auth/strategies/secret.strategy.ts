import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { BadRequestException } from '@nestjs/common';
import { Strategy } from 'passport-strategy'; // Đảm bảo bạn import đúng Strategy từ passport-strategy
import { ConfigService } from '@nestjs/config';
import { AuthError, AuthStrategy } from '../auth.constant';
import { Request } from 'express';

@Injectable()
export class SecretStrategy extends PassportStrategy(
  Strategy,
  AuthStrategy.Secret
) {
  constructor(private readonly configService: ConfigService) {
    super({
      passReqToCallback: true, // Truyền request vào callback
    });
  }

  async validate(req: Request): Promise<boolean> {
    const secret = this.configService.get<string>('NEXT_PRIVATE_API_KEY'); // Lấy secret từ config
    if (req.header(AuthStrategy.Secret) !== secret) {
      throw new BadRequestException(AuthError.InvalidSecret); // Nếu secret không đúng, ném ngoại lệ
    }
    return true; // Nếu hợp lệ, trả về true
  }
}
