// system-log.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SystemLog, SystemLogType } from '../../entities/system-log.entity';
import { CreateSystemLogDTO, SystemLogResponse } from './system-log.interface';
import { Pagination } from '../paginate/pagination';
import { PaginationOptionsInterface } from '../paginate/pagination.options.interface';

@Injectable()
export class SystemLogService {
  private readonly logger = new Logger(SystemLogService.name);

  constructor(
    @InjectModel(SystemLog.name)
    private readonly systemLogModel: Model<SystemLog>
  ) {}

  async log(createSystemLogDto: CreateSystemLogDTO): Promise<SystemLog> {
    try {
      const log = new this.systemLogModel(createSystemLogDto);
      return await log.save();
    } catch (error) {
      this.logger.error('Failed to create system log', error.stack);
      throw error;
    }
  }

  async findByType(type: SystemLogType): Promise<SystemLog[]> {
    return this.systemLogModel.find({ type }).sort({ loggedAt: -1 }).exec();
  }

  async findAll(
    options: PaginationOptionsInterface,
    startDate?: string,
    endDate?: string
  ): Promise<Pagination<SystemLogResponse>> {
    const filter: any = {};
    const { page, limit } = options;

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const logs = await this.systemLogModel
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const total = await this.systemLogModel.countDocuments(filter);

    const mappedLogs: SystemLogResponse[] = logs.map((log: any) => ({
      _id: log._id?.toString(),
      message: log.message,
      status: log.status,
      type: log.type,
      createdAt: log.createdAt ?? new Date(),
      updatedAt: log.updatedAt ?? new Date(),
      note: log.note ?? '',
      data: log.data ?? null,
      user: log.user
        ? {
            _id: log.user._id?.toString(),
            username: log.user.username,
            name: log.user.name,
            role: log.user.role,
          }
        : undefined,
    }));

    // Calculate next and previous page links
    const totalPages = Math.ceil(total / limit);

    return new Pagination<SystemLogResponse>({
      results: mappedLogs,
      total: total,
      total_page: totalPages,
      page_size: limit,
      current_page: page,
    });
  }

  // Thêm phương thức tìm thống kê người dùng mới nhất
  async findLatestUserStatistic(): Promise<SystemLog | null> {
    return this.systemLogModel
      .findOne({ type: SystemLogType.UserStatistic }) // Lọc theo loại log là UserStatistic
      .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo giảm dần
      .exec(); // Thực thi truy vấn
  }
}
