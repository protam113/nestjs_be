// system-log.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SystemLog, SystemLogType } from '../../entities/system-log.entity';
import { CreateSystemLogDTO, SystemLogResponse } from './system-log.interface';
import { Pagination } from '../paginate/pagination';
import { PaginationOptionsInterface } from '../paginate/pagination.options.interface';
import { RedisCacheService } from '../cache/redis-cache.service';
import { buildCacheKey } from '../../utils/cache-key.util';

@Injectable()
export class SystemLogService {
  private readonly logger = new Logger(SystemLogService.name);

  constructor(
    @InjectModel(SystemLog.name)
    private readonly systemLogModel: Model<SystemLog>,
    private readonly redisCacheService: RedisCacheService
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

  async findAll(
    options: PaginationOptionsInterface,
    filters: {
      type?: SystemLogType;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<Pagination<SystemLogResponse>> {
    const { type, startDate, endDate } = filters;

    const cacheKey = buildCacheKey('logs', {
      page: options.page,
      limit: options.limit,
      start: startDate,
      end: endDate,
      type, // Add type to cache key
    });

    const cached =
      await this.redisCacheService.get<Pagination<SystemLogResponse>>(cacheKey);

    if (cached) {
      this.logger.log(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    const filter: any = {};
    const { page, limit } = options;

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Add type filter if provided
    if (type) {
      filter.type = type;
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

    const result = new Pagination<SystemLogResponse>({
      results: mappedLogs,
      total: total,
      total_page: Math.ceil(total / options.limit),
      page_size: limit,
      current_page: page,
    });

    await this.redisCacheService.set(cacheKey, result, 3600).catch(() => null);
    return result;
  }

  // Thêm phương thức tìm thống kê người dùng mới nhất
  async findLatestUserStatistic(): Promise<SystemLog | null> {
    return this.systemLogModel
      .findOne({ type: SystemLogType.UserStatistic }) // Lọc theo loại log là UserStatistic
      .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo giảm dần
      .exec(); // Thực thi truy vấn
  }
}
