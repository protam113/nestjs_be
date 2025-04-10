import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  private readonly csrfCookieName = 'CSRF-TOKEN';
  private readonly tokenStore = new Map<string, string>();

  use(req: Request, res: Response, next: NextFunction) {
    const cookieToken = req.cookies[this.csrfCookieName];

    if (this.safeMethods.includes(req.method)) {
      const token = cookieToken || uuidv4();

      this.tokenStore.set(token, token);

      if (!cookieToken) {
        res.cookie(this.csrfCookieName, token, {
          httpOnly: true,
          sameSite: 'strict',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: 24 * 60 * 60 * 1000, // 1 ngày
        });
      }

      return next();
    }

    if (!cookieToken || !this.tokenStore.has(cookieToken)) {
      throw new ForbiddenException('Invalid or missing CSRF token');
    }

    return next();
  }

  private cleanupTokens() {
    this.tokenStore.clear();
  }
}
