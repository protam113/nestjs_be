import {
  Body,
  Controller,
  Logger,
  Post,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { HttpCode } from '@nestjs/common';

import { AuthService } from './auth.service';
import { LogInDTO } from './dtos/log-in.dto';
import { AuthSuccess } from './auth.constant';
import { LogInResponse } from './responses/log-in.response';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('public/auth')
export class AuthPublicController {
  private readonly logger = new Logger(AuthPublicController.name);

  constructor(
    private readonly service: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  @Post('login')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor(''))
  async login(
    @Body() dto: LogInDTO,
    @Res({ passthrough: true }) res: Response
  ): Promise<LogInResponse> {
    this.logger.debug('Login attempt for username:', dto.username);

    const result = await this.service.validateAttemptAndSignToken(dto);
    this.logger.debug(
      'Login validation successful for role:',
      result.userInfo.role
    );

    // Generate access token
    const accessToken = this.jwtService.sign(
      {
        _id: result.userInfo._id,
        role: result.userInfo.role,
        username: result.userInfo.username,
      },
      {
        expiresIn: '1d', // 1 day
      }
    );

    const refreshToken = this.jwtService.sign(
      {
        _id: result.userInfo._id,
        role: result.userInfo.role,
        username: result.userInfo.username,
      },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d', // 7 days
      }
    );

    // Set cookies
    res.cookie('user_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return result;
  }

  // Update logout to clear both tokens
  @Post('logout')
  async logout(
    @Res({ passthrough: true }) res: Response
  ): Promise<{ status: string; message: string }> {
    res.cookie('user_token', '', {
      httpOnly: true,
      expires: new Date(0),
    });

    res.cookie('refresh_token', '', {
      httpOnly: true,
      expires: new Date(0),
    });

    return { status: 'success', message: AuthSuccess.LogoutSuccess };
  }
}
