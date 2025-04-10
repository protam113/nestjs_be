import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitInfo {
  count: number;
  expiresAt: number;
  violations: number;
  banUntil?: number;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly windowMs = 5 * 1000; // 1s
  private readonly maxRequests = 5;
  private readonly ipStore = new Map<string, RateLimitInfo>();

  use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const current = this.ipStore.get(ip);

    // Nếu đang bị ban
    if (current?.banUntil && current.banUntil > now) {
      const retryAfter = Math.ceil((current.banUntil - now) / 1000);
      throw new HttpException(
        `Too many requests. Temporarily banned for ${retryAfter}s`,
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    if (!current || current.expiresAt < now) {
      // Reset count và hết hạn nếu timeout
      this.ipStore.set(ip, {
        count: 1,
        expiresAt: now + this.windowMs,
        violations: current?.violations || 0,
      });
    } else {
      current.count += 1;

      if (current.count > this.maxRequests) {
        current.violations += 1;

        // Thời gian ban = 2^violation * 1s, tối đa 1h
        const banTime = Math.min(
          2 ** current.violations * 1000,
          60 * 60 * 1000
        );
        current.banUntil = now + banTime;
        current.count = 0; // reset count khi ban

        this.ipStore.set(ip, current);

        throw new HttpException(
          `Rate limit exceeded. IP temporarily banned for ${banTime / 1000}s`,
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      this.ipStore.set(ip, current);
    }

    next();
  }
}
