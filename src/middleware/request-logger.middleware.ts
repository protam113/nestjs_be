// middlewares/request-logger.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../logger/logger';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = uuidv4();
    const { method, originalUrl, headers, ip } = req;

    // Gắn requestId để truy trace logs
    (req as any).requestId = requestId;

    const msg = {
      requestId,
      method,
      url: originalUrl,
      headers,
      ip,
    };

    logger.info(`Incoming ${method} ${originalUrl} ${JSON.stringify(msg)}`);

    next();
  }
}
