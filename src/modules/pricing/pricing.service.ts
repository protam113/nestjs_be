import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// Cache
import { RedisCacheService } from '../cache/redis-cache.service';
import { buildCacheKey } from '../../utils/cache-key.util';

// Pagination
import { Pagination } from '../paginate/pagination';
import { PaginationOptionsInterface } from '../paginate/pagination.options.interface';

// UserData
import { UserData } from '../user/user.interface';

// Entity
import { PricingEntity, PricingDocument } from '../../entities/pricing.entity';

// Components
import { SlugProvider } from '../slug/slug.provider';
import { Error, StatusCode } from './pricing,constant';
import { DataResponse } from './responses/data.response';
import { CreatePricingDto } from './dto/create-pricing.dto';

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(
    @InjectModel(PricingEntity.name)
    private readonly pricingModel: Model<PricingDocument>,
    private readonly slugProvider: SlugProvider,
    private readonly redisCacheService: RedisCacheService
  ) {}

  async findAll(
    options: PaginationOptionsInterface,
    startDate?: string,
    endDate?: string,
    status?: string
  ): Promise<Pagination<DataResponse>> {
    const cacheKey = buildCacheKey('pricings', {
      page: options.page,
      limit: options.limit,
      start: startDate,
      end: endDate,
      status,
    });

    const cached = await this.redisCacheService.get<{
      results: any[];
      pagination: any;
    }>(cacheKey);

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

    if (status) {
      filter.status = status;
    }

    const pricings = await this.pricingModel
      .find(filter)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean();

    const total = await this.pricingModel.countDocuments(filter);

    const results = pricings.map(this.mapToDataResponse);

    const result: Pagination<DataResponse> = {
      results,
      pagination: {
        total_page: Math.ceil(total / options.limit),
        page_size: options.limit,
        current_page: options.page,
        total,
      },
    };

    await this.redisCacheService.set(cacheKey, result, 3600).catch(() => null);
    return result;
  }

  async created(
    createPricingDto: CreatePricingDto,
    user: UserData
  ): Promise<PricingDocument> {
    const { title, description, price, subData } = createPricingDto;

    const slug = this.slugProvider.generateSlug(title, { unique: true });

    const existingPricing = await this.pricingModel.findOne({
      $or: [{ title }],
    });

    if (existingPricing) {
      throw new BadRequestException(Error.ThisPricingAlreadyExists);
    }

    const newPricing = new this.pricingModel({
      title,
      description,
      price: price || undefined,
      subData,
      slug,
      status: 'show',
      user: {
        userId: user._id,
        username: user.username,
        role: user.role,
      },
    });

    try {
      const saved = await newPricing.save();
      await this.redisCacheService.reset();
      return saved;
    } catch (err) {
      if (err.code === 11000) {
        throw new BadRequestException({
          statusCode: StatusCode.Conflict,
          message: Error.ThisPricingAlreadyExists,
          error: 'Conflict',
        });
      }
      throw err;
    }
  }

  private mapToDataResponse(pricing: PricingDocument): DataResponse {
    return {
      _id: pricing._id,
      title: pricing.title,
      description: pricing.description,
      slug: pricing.slug,
      status: pricing.status,
      subData: pricing.subData,
    };
  }

  async findBySlug(slug: string): Promise<DataResponse> {
    const cacheKey = `pricing_${slug}`;
    const cached = await this.redisCacheService.get<DataResponse>(cacheKey);

    if (cached) {
      this.logger.log(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    const pricing = await this.pricingModel.findOne({ slug }).lean();
    if (!pricing) {
      throw new BadRequestException({
        statusCode: StatusCode.NotFound,
        message: Error.PricingNotFound,
        error: 'Not Found',
      });
    }

    const result = this.mapToDataResponse(pricing);
    await this.redisCacheService
      .set(cacheKey, result, 3600)
      .catch((err) => this.logger.error(`Failed to cache ${cacheKey}`, err));

    return result;
  }

  async findByUuid(_id: string): Promise<DataResponse> {
    const pricing = await this.pricingModel.findById(_id).lean();
    if (!pricing) {
      throw new BadRequestException({
        statusCode: StatusCode.NotFound,
        message: Error.PricingNotFound,
        error: 'Not Found',
      });
    }
    return this.mapToDataResponse(pricing);
  }

  async update(
    _id: string,
    updateData: { title: string; description?: string },
    user: UserData
  ): Promise<PricingDocument> {
    const pricing = await this.pricingModel.findById(_id);
    if (!pricing) {
      throw new BadRequestException({
        statusCode: StatusCode.NotFound,
        message: Error.PricingNotFound,
        error: 'Not Found',
      });
    }

    if (!updateData.title) {
      throw new BadRequestException({
        statusCode: StatusCode.BadRequest,
        message: 'Title is required',
        error: 'Bad Request',
      });
    }

    const normalizedTitle = updateData.title.trim();
    if (
      normalizedTitle === pricing.title &&
      updateData.description?.trim() === pricing.description
    ) {
      return pricing;
    }

    const existingPricing = await this.pricingModel.findOne({
      _id: { $ne: _id },
      title: normalizedTitle,
    });

    if (existingPricing) {
      throw new BadRequestException({
        statusCode: StatusCode.Conflict,
        message: Error.ThisPricingAlreadyExists,
        error: 'Conflict',
      });
    }

    try {
      pricing.title = normalizedTitle;
      if (updateData.description) {
        pricing.description = updateData.description.trim();
      }
      pricing.slug = this.slugProvider.generateSlug(normalizedTitle, {
        unique: true,
      });

      const updatedPricing = await this.pricingModel.findByIdAndUpdate(
        _id,
        {
          $set: {
            title: pricing.title,
            description: pricing.description,
            slug: pricing.slug,
            updatedAt: new Date(),
            user: {
              userId: user._id,
              username: user.username,
              role: user.role,
            },
          },
        },
        { new: true, runValidators: true }
      );

      if (!updatedPricing) {
        throw new BadRequestException({
          statusCode: StatusCode.NotFound,
          message: Error.PricingNotFound,
          error: 'Not Found',
        });
      }

      await this.redisCacheService.reset();
      return updatedPricing as PricingDocument;
    } catch (err) {
      if (err.code === 11000) {
        throw new BadRequestException({
          statusCode: StatusCode.Conflict,
          message: Error.ThisPricingAlreadyExists,
          error: 'Conflict',
        });
      }
      throw new BadRequestException({
        statusCode: StatusCode.ServerError,
        message: 'Internal server error',
        error: 'Internal Server Error',
      });
    }
  }

  async delete(_id: string): Promise<void> {
    const result = await this.pricingModel.findByIdAndDelete(_id);
    await this.redisCacheService.reset();

    if (!result) {
      throw new NotFoundException(Error.PricingNotFound);
    }
  }
}
