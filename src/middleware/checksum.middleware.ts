import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class ChecksumMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ChecksumMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    if (req.path === '/public/auth/login' && req.method === 'POST') {
      const receivedChecksum = req.headers['x-checksum'] as string;
      if (!receivedChecksum) {
        this.logger.warn('No checksum provided in request headers');
        throw new BadRequestException('Checksum is required');
      }

      // Create checksum from request body
      const body = JSON.stringify(req.body);
      const calculatedChecksum = crypto
        .createHash('sha256')
        .update(body + process.env.API_SECRET)
        .digest('hex');

      this.logger.log(`Received checksum: ${receivedChecksum}`);
      this.logger.log(`Calculated checksum: ${calculatedChecksum}`);

      if (receivedChecksum !== calculatedChecksum) {
        this.logger.warn('Checksum verification failed');
        throw new BadRequestException('Invalid checksum');
      }

      this.logger.log('Checksum verification successful');
    }
    next();
  }
}
