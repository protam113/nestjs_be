import { InjectModel } from '@nestjs/mongoose';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { MediaService } from '../media/media.service';
import { SlugProvider } from '../slug/slug.provider';
import { ServiceDocument, ServiceEntity } from '../../entities/service.entity';
import { RedisCacheService } from '../cache/redis-cache.service';

import { Model } from 'mongoose';
import { Pagination } from '../paginate/pagination';
import { PaginationOptionsInterface } from '../paginate/pagination.options.interface';
import { UserData } from '../user/user.interface';
import { CreateServiceDto } from './dto/create-service';
import { DataResponse } from './responses/service.response';
import { DetailResponse } from './responses/detail.response';

import {
  Error,
  Message,
  SERVICE_CACHE_TTL,
  ServiceStatus,
} from './service.constant';
import { buildCacheKey } from '../../utils/cache-key.util';
import { StatusCode, StatusType } from 'src/entities/status_code.entity';
import { toDataResponse } from './service.mapper';
import { CreateServiceResponse } from './responses/create_service.response';
import { buildServiceFilter } from 'src/helpers/service.helper';

@Injectable()
export class ServiceService {
  private readonly logger = new Logger(ServiceService.name);

  constructor(
    @InjectModel(ServiceEntity.name)
    private readonly serviceModel: Model<ServiceDocument>,
    private readonly slugProvider: SlugProvider,
    private readonly redisCacheService: RedisCacheService,
    private readonly mediaService: MediaService
  ) {}

  async findAll(
    options: PaginationOptionsInterface,
    startDate?: string,
    endDate?: string,
    status?: ServiceStatus
  ): Promise<Pagination<DataResponse>> {
    const cacheKey = buildCacheKey('services', {
      page: options.page,
      limit: options.limit,
      start: startDate,
      end: endDate,
      status: status || 'all',
    });
    const cached =
      await this.redisCacheService.get<Pagination<DataResponse>>(cacheKey);

    if (cached) {
      this.logger.log(`Cache HIT: ${cacheKey}`);
      return cached;
    }
    const filter = buildServiceFilter({ startDate, endDate, status });

    const services = await this.serviceModel
      .find(filter)
      .skip((options.page - 1) * options.limit)
      .sort({ createdAt: -1 })
      .limit(options.limit)
      .exec();

    const total = await this.serviceModel.countDocuments(filter);

    const results = services.map(toDataResponse);

    const result = new Pagination<DataResponse>({
      results,
      total,
      total_page: Math.ceil(total / options.limit),
      page_size: options.limit,
      current_page: options.page,
    });

    await this.redisCacheService.set(
      cacheKey,
      result,
      SERVICE_CACHE_TTL.SERVICE_LIST
    );
    return result;
  }

  async create(
    createServiceDto: CreateServiceDto,
    user: UserData,
    file?: Express.Multer.File
  ): Promise<CreateServiceResponse> {
    const { title, content, description, price, link, status } =
      createServiceDto;

    // Validate title
    if (!title || title.trim() === '') {
      throw new BadRequestException({
        message: 'Title is required to generate slug',
        error: Error.TITLE_REQUIRED,
      });
    }

    // Generate unique slug
    const slug = this.slugProvider.generateSlug(title, { unique: true });

    const existing = await this.serviceModel.findOne({
      $or: [{ title }, { slug }],
    });

    if (existing) {
      throw new BadRequestException({
        statusCode: StatusCode.BadRequest,
        message: Message.ThisServiceAlreadyExists,
        error: Error.SERVICE_ALREADY_EXIT,
      });
    }

    const parsedPrice = Number(price);
    if (price && isNaN(parsedPrice)) {
      throw new BadRequestException({
        statusCode: StatusCode.BadRequest,
        message: Message.ValidPrice,
        error: Error.PRICE_VALIDATION,
      });
    }

    let imageUrl = '';
    if (!file) {
      throw new BadRequestException({
        statusCode: StatusCode.BadRequest,
        message: Message.FileRequired,
        error: Error.FILE_REQUIRED,
      });
    }

    const folderPath = '/service';
    try {
      const uploadedImage = await this.mediaService.uploadFile(
        folderPath,
        file
      );
      imageUrl = uploadedImage.url;
    } catch (error) {
      throw new BadRequestException({
        statusCode: StatusCode.BadRequest,
        message: Message.FailedUploadImage,
        error: Error.FILE_UPLOAD_FAILED,
      });
    }

    const newService = new this.serviceModel({
      title,
      slug,
      content,
      description,
      price: parsedPrice,
      link: link || undefined,
      file: imageUrl || '',
      status: status || ServiceStatus.Draft,
      user: {
        userId: user._id,
        username: user.username,
        role: user.role,
      },
    });

    await this.redisCacheService.delByPattern('services*');
    await this.redisCacheService.del(`services_${slug}`);

    await newService.save();
    return {
      status: StatusType.Success,
      result: newService,
    };
  }

  async delete(id: string): Promise<void> {
    const result = await this.serviceModel.findByIdAndDelete(id);
    if (result) {
      await this.redisCacheService.delByPattern('services*');
      await this.redisCacheService.del(`service_${id}`);
    } else {
      // If the blog wasn't found, throw a clear error
      throw new BadRequestException({
        statusCode: StatusCode.BadRequest,
        message: Message.ServiceNotFound,
        error: Error.NOT_FOUND,
      });
    }
  }

  async updateStatus(
    id: string,
    status: ServiceStatus
  ): Promise<ServiceDocument> {
    if (!Object.values(ServiceStatus).includes(status)) {
      throw new BadRequestException({
        statusCode: StatusCode.BadRequest,
        message: Message.InvalidStatus,
        error: Error.INVALID_STATUS,
      });
    }

    const service = await this.serviceModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!service) {
      throw new BadRequestException({
        statusCode: StatusCode.BadRequest,
        message: Message.ServiceNotFound,
        error: Error.NOT_FOUND,
      });
    }
    await this.redisCacheService.delByPattern('services*');
    await this.redisCacheService.del(`service_${id}`);

    return service;
  }

  async findBySlug(slug: string): Promise<DetailResponse> {
    const cacheKey = `service_${slug}`;
    const cached = await this.redisCacheService.get<DetailResponse>(cacheKey);

    if (cached) {
      this.logger.log(`Cache HIT: ${cacheKey}`);
      return cached;
    }
    const service = await this.serviceModel.findOne({ slug }).exec();

    if (!service) {
      throw new BadRequestException({
        statusCode: StatusCode.BadRequest,
        message: Message.ServiceNotFound,
        error: Error.NOT_FOUND,
      });
    }
    const result = toDataResponse(service);

    await this.redisCacheService.set(
      cacheKey,
      result,
      SERVICE_CACHE_TTL.SERVICE_DETAIL
    );
    return {
      status: 'success',
      result: result,
    };
  }

  async validateService(serviceId: string): Promise<boolean> {
    try {
      const service = await this.serviceModel.findById(serviceId).exec();
      return !!service;
    } catch (error) {
      this.logger.error(`Error validating service: ${error.message}`);
      return false;
    }
  }

  async validateServices(serviceIds: string[]): Promise<boolean> {
    try {
      const count = await this.serviceModel
        .countDocuments({
          _id: { $in: serviceIds },
        })
        .exec();

      return count === serviceIds.length;
    } catch (error) {
      this.logger.error(`Error validating services: ${error.message}`);
      return false;
    }
  }

  async updateView(slug: string, newViews: number): Promise<ServiceDocument> {
    if (newViews < 0) {
      throw new BadRequestException(Message.InvalidViewsCount);
    }

    // Tìm và cập nhật blog theo slug
    const project = await this.serviceModel.findOneAndUpdate(
      { slug },
      { $inc: { views: newViews } },
      { new: true }
    );

    if (!project) {
      throw new NotFoundException(Message.ServiceNotFound);
    }

    await this.redisCacheService
      .reset()
      .catch((err) => this.logger.error('Failed to clear cache:', err));

    return project;
  }
}
