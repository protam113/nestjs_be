import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../entities/user.entity';
import { UserError } from './user.constant';
import type { UserData, UserResponse } from './user.interface';
import { Role } from '../../common/enums/role.enum';
import { CreateManagerDto } from './dto/create-manager.dto';
import { RedisCacheService } from '../cache/redis-cache.service';
import { buildCacheKey } from '../../utils/cache-key.util';
import { Pagination } from '../paginate/pagination';
import { PaginationOptionsInterface } from '../paginate/pagination.options.interface';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly redisCacheService: RedisCacheService
  ) {}

  async getAllUsers(
    role?: Role,
    startDate?: string,
    endDate?: string,
    searchQuery?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<Pagination<UserResponse>> {
    const cacheKey = buildCacheKey('users', {
      page,
      limit,
      start: startDate,
      end: endDate,
      role: role || 'all',
      search: searchQuery || '',
    });

    const cached =
      await this.redisCacheService.get<Pagination<UserResponse>>(cacheKey);

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
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await this.userModel.countDocuments(filter);

    const results = users.map((user) => ({
      status: 'success',
      message: 'User retrieved successfully',
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
    })) as UserResponse[];

    const result = new Pagination<UserResponse>({
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
    const {
      username,
      password,
      email,
      phoneNumber,
      name,
      // Không cần lấy role từ DTO, sẽ set mặc định ở dưới
    } = createManagerDto;

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
      role: Role.Manager, // Set cứng ở đây luôn
      user: {
        userId: user._id,
        username: user.username,
        role: user.role,
      },
    });

    const savedUser = await newUser.save();
    return this.mapToUserResponse(savedUser);
  }

  private mapToUserResponse(user: any): UserResponse {
    const { _id, name, username, role, email, phoneNumber } = user;
    return {
      status: 'success',
      message: 'User retrieved successfully',
      user: {
        _id,
        name,
        username,
        role,
        email,
        phoneNumber,
      },
    };
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

  async findByUuid(_id: string): Promise<UserResponse | null> {
    // Create cache key using only the user ID
    const cacheKey = buildCacheKey('user', { id: _id });

    // Try to get from cache first
    const cached = await this.redisCacheService.get<UserResponse>(cacheKey);

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
    const response = this.mapToUserResponse(user);

    // Save to cache for 1 hour (3600 seconds)
    await this.redisCacheService
      .set(cacheKey, response, 3600)
      .catch((err) => this.logger.error('Cache set failed:', err));

    return response;
  }

  async deleteManagerById(
    userId: string
  ): Promise<{ status: string; message: string }> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new BadRequestException(UserError.UserNotFound || 'User not found');
    }

    if (user.role !== Role.Manager) {
      throw new BadRequestException(
        'Only users with the Admin role can be deleted using this method.'
      );
    }

    await this.userModel.findByIdAndDelete(userId);

    this.logger.log(`Deleted manager with ID: ${userId}`);

    return {
      status: 'success',
      message: 'Manager deleted successfully',
    };
  }
}
