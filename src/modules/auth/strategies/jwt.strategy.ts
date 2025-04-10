// jwt.strategy.ts
import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Request as RequestType } from 'express';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // Import ConfigService

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.extractJWT,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'), // Lấy từ ConfigService
    });
  }

  private static extractJWT(req: RequestType): string | null {
    const token = req.cookies?.user_token;
    if (token && token.length > 0) {
      return token;
    }
    return null;
  }

  async validate(payload: any) {
    this.logger.log('JWT Payload:', payload); // Log payload để kiểm tra

    // Thêm thông tin vào request.user
    return {
      userId: payload._id,
      role: payload.role,
      username: payload.username,
    };
  }
}
