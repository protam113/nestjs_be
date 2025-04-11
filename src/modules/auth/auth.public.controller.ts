import { Body, Controller, Post, Res, UseInterceptors } from '@nestjs/common';
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
  constructor(
    private readonly service: AuthService,
    private readonly jwtService: JwtService
  ) {}

  @Post('login')
  @HttpCode(200)
  // @UseInterceptors(FileInterceptor(''))
  async login(
    @Body() dto: LogInDTO,
    @Res({ passthrough: true }) res: Response
  ): Promise<LogInResponse> {
    const result = await this.service.validateAttemptAndSignToken(dto);

    // Set token từ service dù không return trong response
    const token = this.jwtService.sign({
      _id: result.userInfo._id,
      role: result.userInfo.role,
      username: result.userInfo.username,
    });
    res.cookie('user_token', token, {
      httpOnly: true,
      maxAge: 3600000,
    });

    return result; // chỉ trả message + userInfo
  }

  @Post('logout')
  async logout(
    @Res({ passthrough: true }) res: Response
  ): Promise<{ status: string; message: string }> {
    res.cookie('user_token', '', {
      httpOnly: true,
      expires: new Date(0),
    });

    return { status: 'success', message: AuthSuccess.LogoutSuccess };
  }
}
