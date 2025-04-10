import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from '../../entities/user.entity';
import { LogInDTO } from './dtos/log-in.dto';
import { LogInResponse } from './responses/log-in.response';
import { AuthError, AuthSuccess } from './auth.constant';
import { ConfigService } from '@nestjs/config';
import { Role } from '../../common/enums/role.enum';
import { response } from 'express';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService
  ) {}

  async onModuleInit() {
    await this.createAdminAccount();
  }

  private async createAdminAccount() {
    const adminUsername = this.configService.get<string>('ADMIN_USERNAME');
    console.log(
      `Attempting to create admin account with username: ${adminUsername}`
    );

    try {
      const existingAdmin = await this.userModel.findOne(
        { username: adminUsername },
        '_id'
      );

      if (existingAdmin?._id) {
        console.log(`Valid admin account exists with ID: ${existingAdmin._id}`);
        return;
      }

      if (existingAdmin) {
        console.warn('Found admin account with null ID, removing...');
        await this.userModel.deleteOne({ username: adminUsername });
      }

      const admin = new this.userModel({
        username: adminUsername,
        password: this.configService.get<string>('ADMIN_PASSWORD'),
        email: this.configService.get<string>('ADMIN_EMAIL'),
        name: this.configService.get<string>('ADMIN_NAME'),
        phoneNumber: this.configService.get<string>('ADMIN_PHONE'),
        role: Role.Admin,
      });

      const savedAdmin = await admin.save();
      console.log(`Admin created successfully with ID: ${savedAdmin._id}`);
    } catch (error) {
      console.error('Admin account creation failed:', error);
      throw error;
    }
  }

  async validateAttemptAndSignToken(dto: LogInDTO): Promise<LogInResponse> {
    if (!dto.attempt || typeof dto.attempt !== 'string') {
      throw new BadRequestException('Password is required');
    }

    const user = (await this.userModel.findOne({
      username: dto.username,
    })) as UserDocument;

    if (!user || !user.password) {
      throw new BadRequestException(AuthError.InvalidLoginCredentials);
    }

    const isValidPassword = await user.comparePassword(dto.attempt);

    if (!isValidPassword) {
      throw new BadRequestException(AuthError.InvalidLoginCredentials);
    }

    if (![Role.Admin, Role.Manager].includes(user.role)) {
      throw new BadRequestException(
        'Access restricted to admin and manager users only'
      );
    }

    return {
      status: 'success',
      message: AuthSuccess.LoginSuccess,
      userInfo: {
        _id: user._id.toString(),
        username: user.username,
        role: user.role,
      },
    };
  }

  async validateUserAndGetRole(_id: string): Promise<string> {
    const user = await this.userModel.findById(_id);
    if (!user?.role) {
      throw new BadRequestException('User role not found');
    }
    return user.role;
  }
}
