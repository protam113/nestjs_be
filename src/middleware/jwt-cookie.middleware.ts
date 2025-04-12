// src/middleware/jwt-cookie.middleware.ts

import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LogsType } from 'src/common/logs/logsType';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtCookieMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const accessToken = req.cookies?.user_token;
    const refreshToken = req.cookies?.refresh_token;

    if (!accessToken && !refreshToken) {
      throw new UnauthorizedException(LogsType.MissingJWT);
    }

    try {
      // Verify access token
      if (accessToken) {
        const decoded = this.jwtService.verify(accessToken);
        req.user = decoded;
        next();
        return;
      }

      // If access token is missing but refresh token exists, try to refresh
      if (refreshToken) {
        this.refreshAccessToken(req, res, refreshToken);
        next();
        return;
      }
    } catch (error) {
      // If access token is invalid, try to use refresh token
      if (refreshToken) {
        try {
          this.refreshAccessToken(req, res, refreshToken);
          next();
          return;
        } catch (refreshError) {
          throw new UnauthorizedException('Invalid tokens');
        }
      }
      throw new UnauthorizedException('Invalid token');
    }
  }

  private refreshAccessToken(
    req: Request,
    res: Response,
    refreshToken: string
  ) {
    try {
      // Verify refresh token
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Generate new access token
      const newAccessToken = this.jwtService.sign(
        {
          _id: decoded._id,
          role: decoded.role,
          username: decoded.username,
        },
        {
          expiresIn: '1d', // 1 day
        }
      );

      // Generate new refresh token
      const newRefreshToken = this.jwtService.sign(
        {
          _id: decoded._id,
          role: decoded.role,
          username: decoded.username,
        },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d', // 7 days
        }
      );

      // Set new cookies
      res.cookie('user_token', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      res.cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Update request user
      req.user = this.jwtService.decode(newAccessToken);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
