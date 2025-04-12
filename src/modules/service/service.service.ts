import { SlugProvider } from '../slug/slug.provider';
import { InjectModel } from '@nestjs/mongoose';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { Pagination } from '../paginate/pagination';
import { PaginationOptionsInterface } from '../paginate/pagination.options.interface';
import { UserData } from '../user/user.interface';
import { CreateServiceDto } from './dto/create-service';
import { DataResponse } from './responses/service.response';
import { Error, ServiceStatus } from './service.constant';
import { ServiceDocument, ServiceEntity } from '../../entities/service.entity';
import { RedisCacheService } from '../cache/redis-cache.service';
import { buildCacheKey } from '../../utils/cache-key.util';

@Injectable()
export class ServiceService {
  private readonly logger = new Logger(ServiceService.name);

  constructor(
    @InjectModel(ServiceEntity.name)
    private readonly serviceModel: Model<ServiceDocument>,
    private readonly slugProvider: SlugProvider,
    private readonly redisCacheService: RedisCacheService
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

    const filter: any = {};

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (status && Object.values(ServiceStatus).includes(status)) {
      filter.status = status;
    }

    const services = await this.serviceModel
      .find(filter)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean();

    const total = await this.serviceModel.countDocuments(filter);

    const results = services.map(this.mapToDataResponse);

    const result = new Pagination<DataResponse>({
      results,
      total,
      total_page: Math.ceil(total / options.limit),
      page_size: options.limit,
      current_page: options.page,
    });

    await this.redisCacheService.set(cacheKey, result, 3600).catch(() => null);
    return result;
  }

  async create(
    createServiceDto: CreateServiceDto,
    user: UserData
  ): Promise<ServiceDocument> {
    const { title, content, description, price, link } = createServiceDto;

    // Generate slug from title
    const slug = this.slugProvider.generateSlug(title, { unique: true });

    const existing = await this.serviceModel.findOne({
      $or: [{ title }, { slug }],
    });

    if (existing) {
      throw new BadRequestException(Error.ThisServiceAlreadyExists);
    }

    const newService = new this.serviceModel({
      title,
      slug,
      content,
      description,
      price: price || undefined,
      link: link || undefined,
      status: ServiceStatus.Show,
      user: {
        userId: user._id,
        username: user.username,
        role: user.role,
      },
    });

    return await newService.save();
  }

  async delete(id: string): Promise<void> {
    const result = await this.serviceModel.findByIdAndDelete(id);
    await this.redisCacheService.reset();
    if (!result) {
      throw new NotFoundException(Error.ServiceNotFound);
    }
  }

  async findBySlug(slug: string): Promise<DataResponse> {
    const cacheKey = `blog_${slug}`;
    const cached = await this.redisCacheService.get<DataResponse>(cacheKey);

    if (cached) {
      this.logger.log(`Cache HIT: ${cacheKey}`);
      return cached;
    }
    const service = await this.serviceModel.findOne({ slug }).lean();

    if (!service) {
      throw new NotFoundException(Error.ServiceNotFound);
    }
    const result = this.mapToDataResponse(service);

    await this.redisCacheService
      .set(cacheKey, result, 3600)
      .catch((err) => this.logger.error(`Failed to cache ${cacheKey}`, err));

    return result;
  }

  async validateService(serviceId: string): Promise<boolean> {
    try {
      const service = await this.serviceModel.findById(serviceId).exec();
      return !!service; // Returns true if service exists, false otherwise
    } catch (error) {
      this.logger.error(`Error validating service: ${error.message}`);
      return false;
    }
  }
  private mapToDataResponse(service: any): DataResponse {
    return {
      status: 'success',
      result: {
        _id: service._id,
        title: service.title,
        slug: service.slug,
        content: service.content,
        description: service.description,
        link: service.link,
        price: service.price,
        status: service.status,
        createdAt: service.createdAt || new Date(),
        updatedAt: service.updatedAt || new Date(),
      },
    };
  }
}
