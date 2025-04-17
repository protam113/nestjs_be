import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../entities/user.entity';
import { UserError, UserSuccess } from './user.constant';
import type {
  UserData,
  UserDataResponse,
  UserResponse,
} from './user.interface';
import { Role } from '../../common/enums/role.enum';
import { CreateManagerDto } from './dto/create-manager.dto';
import { RedisCacheService } from '../cache/redis-cache.service';
import { buildCacheKey } from '../../utils/cache-key.util';
import { Pagination } from '../paginate/pagination';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { EmailPasswordService } from 'src/services/email_password.service';
import { randomBytes } from 'crypto';
import { VerificationCode } from './interfaces/verification-code.interface';
import { EmailRegisterService } from 'src/services/email_register.service';
import { toDataResponse } from './user.mapper';
import { StatusType } from 'src/entities/status_code.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private verificationCodes: Map<
    string,
    VerificationCode & { newPassword: string }
  > = new Map();

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly redisCacheService: RedisCacheService,
    private readonly emailPasswordService: EmailPasswordService,
    private readonly emailRegisterService: EmailRegisterService
  ) {}

  async getAllUsers(
    role?: Role,
    startDate?: string,
    endDate?: string,
    searchQuery?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<Pagination<Omit<User, 'password'>>> {
    const cacheKey = buildCacheKey('users', {
      page,
      limit,
      start: startDate,
      end: endDate,
      role: role || 'all',
      search: searchQuery || '',
    });

    const cached =
      await this.redisCacheService.get<Pagination<Omit<User, 'password'>>>(
        cacheKey
      );

    if (cached) {
      this.logger.log(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    const filter: any = {};

    if (role) {
      filter.role = role;
    }

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (searchQuery) {
      filter.$or = [
        { username: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
        { phoneNumber: { $regex: searchQuery, $options: 'i' } },
      ];
    }

    const users = await this.userModel
      .find(filter)
      .select(
        '_id name username role email phoneNumber password createdAt updatedAt'
      ) // Explicitly select fields
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await this.userModel.countDocuments(filter);

    // Convert the users to the correct type and omit password
    const results = users.map((user: any) => {
      // Use type assertion for now
      const mappedUser = toDataResponse(user);
      const { password, ...userWithoutPassword } = mappedUser;
      return {
        ...userWithoutPassword,
        role: user.role as Role,
        createdAt: new Date(user.createdAt), // Convert to Date object
        updatedAt: new Date(user.updatedAt), // Convert to Date object
      };
    });

    const result = new Pagination<Omit<User, 'password'>>({
      results,
      total,
      total_page: Math.ceil(total / limit),
      page_size: limit,
      current_page: page,
    });

    await this.redisCacheService.set(cacheKey, result, 3600).catch(() => null);
    return result;
  }

  async createManagerUser(
    createManagerDto: CreateManagerDto,
    user: UserData
  ): Promise<UserResponse> {
    const { username, password, email, phoneNumber, name } = createManagerDto;

    // Check tồn tại user
    const existingUser = await this.userModel.findOne({ email, username });
    if (existingUser) {
      throw new BadRequestException(UserError.ThisEmailAlreadyExists);
    }

    const newUser = new this.userModel({
      username,
      password,
      email,
      phoneNumber,
      name,
      role: Role.Manager,
      data: {
        userId: user._id,
        username: user.username,
        role: user.role,
      },
    });
    try {
      await this.emailRegisterService.sendRegisterMail({
        recipientEmail: email,
        name,
        username,
        password,
      });
    } catch (error) {
      this.logger.error('Failed to send registration email:', error);
      // Continue with the response even if email fails
    }
    const savedUser = await newUser.save();
    await this.redisCacheService.reset();

    return {
      message: UserSuccess.UserCreated,
      data: {
        _id: savedUser._id,
        name: savedUser.name,
        username: savedUser.username,
        role: savedUser.role,
        email: savedUser.email,
        phoneNumber: savedUser.phoneNumber,
      },
    } as UserResponse;
  }

  async getUserStatistic() {
    const totalUsers = await this.userModel.countDocuments();

    const roleCounts = await this.userModel.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]);

    const countsByRole = roleCounts.reduce(
      (acc, { _id, count }) => {
        acc[_id] = count;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalUsers,
      ...countsByRole,
    };
  }

  async getTotalCountOfEachStatus(): Promise<Record<string, number>> {
    const counts = await this.userModel.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    return counts.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {});
  }

  async findByUsernameOrEmail(identifier: string): Promise<User | null> {
    return this.userModel.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });
  }

  async findByUuid(_id: string): Promise<UserDataResponse | null> {
    // Create cache key using only the user ID
    const cacheKey = buildCacheKey('user', { id: _id });

    // Try to get from cache first
    const cached = await this.redisCacheService.get<UserDataResponse>(cacheKey);

    if (cached) {
      this.logger.log(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    // If not in cache, get from database
    const user = await this.userModel.findById(_id).lean();
    if (!user) {
      return null;
    }

    // Map to response format
    const response = toDataResponse(user);

    // Create a properly typed UserResponse object
    const userResponse: UserDataResponse = {
      status: 'success',
      message: 'User found successfully',
      data: {
        _id: response._id,
        name: response.name,
        username: response.username,
        role: response.role,
        email: response.email,
        phoneNumber: response.phoneNumber,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
      },
    };

    // Save to cache for 1 hour (3600 seconds)
    await this.redisCacheService
      .set(cacheKey, userResponse, 3600)
      .catch((err) => this.logger.error('Cache set failed:', err));

    return userResponse;
  }

  async deleteManagerById(
    userId: string
  ): Promise<{ status: string; message: string }> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new BadRequestException(UserError.UserNotFound || 'User not found');
    }

    if (user.role !== Role.Manager) {
      throw new BadRequestException(UserError.RoleError);
    }

    await this.userModel.findByIdAndDelete(userId);

    await this.redisCacheService.reset();

    return {
      status: 'success',
      message: 'Manager deleted successfully',
    };
  }

  async initiatePasswordChange(
    userId: string,
    dto: UpdatePasswordDto
  ): Promise<{ status: string; message: string }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException(UserError.UserNotFound);
    }

    const isValidPassword = await user.comparePassword(dto.currentPassword);
    if (!isValidPassword) {
      throw new BadRequestException(UserError.CurrentIncorrect);
    }

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException(UserError.PasswordNotMatch);
    }

    const verificationCode = randomBytes(3).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

    this.verificationCodes.set(userId, {
      code: verificationCode,
      expiresAt,
      newPassword: dto.newPassword,
    });

    // Gửi email bất đồng bộ, phản hồi API ngay
    setImmediate(() => {
      this.emailPasswordService
        .sendMail({
          recipientEmail: user.email,
          verificationCode,
        })
        .catch((error) => {
          this.logger.error(`Email sent failed to ${user.email}:`, error);
        });
    });

    return {
      status: 'success',
      message: UserSuccess.VerificationSent,
    };
  }

  async verifyCodeAndUpdatePassword(
    userId: string,
    code: string
  ): Promise<{ status: string; message: string }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException(UserError.UserNotFound);
    }

    const storedVerification = this.verificationCodes.get(userId);

    if (!storedVerification) {
      throw new BadRequestException(UserError.NoVerificationCode);
    }

    if (new Date() > storedVerification.expiresAt) {
      this.verificationCodes.delete(userId);
      throw new BadRequestException(UserError.VerificationExpired);
    }

    if (storedVerification.code !== code.toUpperCase()) {
      throw new BadRequestException(UserError.InvalidVerification);
    }

    // Get the stored password change request
    const passwordChangeRequest = this.verificationCodes.get(userId);
    if (!passwordChangeRequest) {
      throw new BadRequestException(UserError.PasswordNotFound);
    }

    try {
      // Update password
      user.password = passwordChangeRequest.newPassword;
      await user.save();

      // Clear verification code
      this.verificationCodes.delete(userId);

      // Invalidate user cache
      const cacheKey = buildCacheKey('user', { id: userId });
      await this.redisCacheService.del(cacheKey).catch(() => null);

      return {
        status: 'success',
        message: UserSuccess.PasswordUpdated,
      };
    } catch (error) {
      this.logger.error('Failed to update password:', error);
      throw new BadRequestException(UserError.FailedUpdatePassword);
    }
  }
}
