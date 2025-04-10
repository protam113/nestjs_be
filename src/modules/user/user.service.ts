import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { User, UserDocument } from '../../entities/user.entity';
import { UserError } from './user.constant';
import type { UserData, UserResponse } from './user.interface';
import { Role } from '../../common/enums/role.enum';
import { CreateManagerDto } from './dto/create-manager.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>
  ) {}

  async getAllUsers(
    role?: Role, // Lọc theo role
    startDate?: string, // Lọc theo ngày tạo bắt đầu
    endDate?: string, // Lọc theo ngày tạo kết thúc
    searchQuery?: string, // Tìm kiếm theo username, email, phoneNumber
    page: number = 1, // Số trang, mặc định là 1
    limit: number = 10 // Số mục trên mỗi trang
  ): Promise<any> {
    const filter: any = {}; // Đối tượng chứa điều kiện lọc

    // Lọc theo role nếu có
    if (role) {
      filter.role = role;
    }

    // Lọc theo ngày tạo nếu có
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Lọc theo tìm kiếm (username, email, phoneNumber)
    if (searchQuery) {
      filter.$or = [
        { username: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
        { phoneNumber: { $regex: searchQuery, $options: 'i' } },
      ];
    }

    // Truy vấn người dùng từ cơ sở dữ liệu với phân trang
    const users = await this.userModel
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Tính toán tổng số người dùng để phân trang
    const totalItems = await this.userModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);

    // Định dạng lại dữ liệu người dùng theo yêu cầu
    const result = users.map((user) => {
      const { _id, name, username, role, email, phoneNumber, __v } = user;
      return {
        _id,
        name,
        username,
        role, // Chuyển role thành mảng
        email,
        phoneNumber,
        __v,
      };
    });

    // Trả về kết quả với dữ liệu người dùng và thông tin phân trang
    return {
      result,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
      },
    };
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
    const user = await this.userModel.findById(_id).lean();
    if (!user) {
      return null;
    }
    const response = this.mapToUserResponse(user);
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
