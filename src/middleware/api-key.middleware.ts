// src/middlewares/api-key.middleware.ts
import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.headers['api-key'] as string;
    const validKey = this.configService.get<string>('NEXT_PRIVATE_API_KEY');

    console.log('Headers:', req.headers);

    if (!validKey) {
      console.log('Valid API key not configured');
      throw new UnauthorizedException(
        'API key validation is not properly configured'
      );
    }

    if (!apiKey) {
      console.log('API Key is missing');
      throw new UnauthorizedException('API key is required');
    }

    if (apiKey.trim() !== validKey.trim()) {
      console.log('API Key is invalid');
      throw new UnauthorizedException('Invalid API key');
    }

    next();
  }
}
