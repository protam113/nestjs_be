import {
  BadRequestException,
  Injectable,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';

// Entity
import { User, UserDocument } from '../../entities/user.entity';

// Components
import { LogInDTO } from './dtos/log-in.dto';
import { LogInResponse } from './responses/log-in.response';
import { AuthError, AuthSuccess } from './auth.constant';
import { Role } from '../../common/enums/role.enum';

@Injectable()

/**
 * =============================
 * 📌 Auth Service Implementation
 * =============================
 *
 * @description Service layer for handling authentication logic
 * including admin initialization, login, and role validation.
 *
 * @class AuthService
 * @injectable
 *
 * @implements OnModuleInit
 *
 * @dependencies
 * - UserModel (MongoDB model via Mongoose)
 * - ConfigService (for accessing environment variables)
 */
export class AuthService implements OnModuleInit {
  /**
   * @property logger
   * Logger instance for logging important lifecycle and auth events
   */
  private readonly logger = new Logger(AuthService.name);

  /**
   * @constructor
   * @param userModel - Mongoose model injected for User collection
   * @param configService - NestJS ConfigService to access .env variables
   */

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService
  ) {}

  /**
   * @lifecycle OnModuleInit
   * Automatically invoked by NestJS after dependency injection
   * Used here to initialize default admin account
   */
  async onModuleInit() {
    await this.createAdminAccount();
  }

  /**
   * ============================
   * 🔐 Private Method: createAdminAccount
   * ============================
   *
   * @description Creates default admin user if not present in DB
   */

  private async createAdminAccount() {
    const adminUsername = this.configService.get<string>('ADMIN_USERNAME');

    try {
      const existingAdmin = await this.userModel.findOne(
        { username: adminUsername },
        '_id'
      );

      if (existingAdmin?._id) {
        return;
      }

      if (existingAdmin) {
        this.logger.warn('Found admin account with null ID, removing...');
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
      this.logger.log(
        `[SUCCESS]  Admin created successfully with ID: ${savedAdmin._id}`
      );
    } catch (error) {
      this.logger.error('Admin account creation failed:', error);
      throw error;
    }
  }

  /**
   * =============================
   * ✅ Public Method: validateAttemptAndSignToken
   * =============================
   *
   * @param dto LogInDTO
   * @returns LogInResponse
   *
   * @description Validates login credentials, user role, and returns login result
   */
  async validateAttemptAndSignToken(dto: LogInDTO): Promise<LogInResponse> {
    if (!dto.password || typeof dto.password !== 'string') {
      throw new BadRequestException(AuthError.PasswordRequired);
    }

    const user = (await this.userModel.findOne({
      username: dto.username,
    })) as UserDocument;

    if (!user || !user.password) {
      throw new BadRequestException(AuthError.InvalidLoginCredentials);
    }

    const isValidPassword = await user.comparePassword(dto.password);

    if (!isValidPassword) {
      throw new BadRequestException(AuthError.InvalidLoginCredentials);
    }

    if (![Role.Admin, Role.Manager].includes(user.role)) {
      throw new BadRequestException(AuthError.AccessDenied);
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

  /**
   * ============================
   * 🔎 Public Method: validateUserAndGetRole
   * ============================
   *
   * @param _id - User ID
   * @returns role - User's role as string
   *
   * @description Verifies user existence and extracts their role
   */
  async validateUserAndGetRole(_id: string): Promise<string> {
    const user = await this.userModel.findById(_id);
    if (!user?.role) {
      throw new BadRequestException(AuthError.UserRole);
    }
    return user.role;
  }
}
