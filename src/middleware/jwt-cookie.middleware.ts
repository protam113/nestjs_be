// src/middleware/jwt-cookie.middleware.ts

import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class JwtCookieMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.user_token;

    if (!token || token.length === 0) {
      throw new UnauthorizedException('Missing authentication token');
    }

    next();
  }
}
