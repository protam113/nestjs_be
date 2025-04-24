import { SlugProvider } from '../slug/slug.provider';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  CategoryDocument,
  CategoryEntity,
} from '../../entities/category.entity';
import { Model } from 'mongoose';

import { Pagination } from '../paginate/pagination';
import { PaginationOptionsInterface } from '../paginate/pagination.options.interface';
import { DataResponse } from './responses/data.response';
import {
  CATEGORY_CACHE_TTL,
  CategoryStatus,
  Error,
  Message,
} from './category.constant';
import { UserData } from '../user/user.interface';
import { CreateCategoryDto } from './dto/create-category.dto';
import { RedisCacheService } from '../cache/redis-cache.service';
import { buildCacheKey } from '../../utils/cache-key.util';
import { StatusCode, StatusType } from 'src/entities/status_code.entity';
import { toDataResponse } from './category.mapper';
import { DetailResponse } from './responses/detail.response';
import { CreateCategoryResponse } from './responses/create_category.response';
import { buildCategoryFilter } from 'src/helpers/category.helpter';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    @InjectModel(CategoryEntity.name)
    private readonly categoryModel: Model<CategoryDocument>,
    private readonly slugProvider: SlugProvider,
    private readonly redisCacheService: RedisCacheService
  ) {}

  async findAll(
    options: PaginationOptionsInterface,
    startDate?: string,
    endDate?: string,
    status?: CategoryStatus
  ): Promise<Pagination<DataResponse>> {
    const cacheKey = buildCacheKey('categories', {
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

    const filter = buildCategoryFilter({ startDate, endDate, status });

    const categories = await this.categoryModel
      .find(filter)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .sort({ createdAt: -1 })
      .exec();

    const total = await this.categoryModel.countDocuments(filter);

    const mappedCategories = categories.map(toDataResponse);

    const result = new Pagination<DataResponse>({
      results: mappedCategories,
      total,
      total_page: Math.ceil(total / options.limit),
      page_size: options.limit,
      current_page: options.page,
    });

    await this.redisCacheService.set(
      cacheKey,
      result,
      CATEGORY_CACHE_TTL.CATEGORY_LIST
    );
    return result;
  }

  async created(
    createCategoryDto: CreateCategoryDto,
    user: UserData
  ): Promise<CreateCategoryResponse> {
    const { name, status } = createCategoryDto;

    // Validate title
    if (!name || name.trim() === '') {
      throw new BadRequestException({
        message: 'Name is required to generate slug',
        error: Error.NAME_REQUIRED,
      });
    }

    const slug = this.slugProvider.generateSlug(name, { unique: true });

    const existingCategory = await this.categoryModel.findOne({
      $or: [{ name }, { slug }],
    });

    if (existingCategory)
      throw new BadRequestException({
        message: Message.ThisCategoryAlreadyExists,
        error: Error.CATEGORY_ALREADY_EXISTS,
      });

    // ✅ Tạo category mới
    const newCategory = new this.categoryModel({
      name,
      slug,
      status: status || CategoryStatus.Draft,
      user: {
        userId: user._id,
        username: user.username,
        role: user.role,
      },
    });

    try {
      await this.redisCacheService.delByPattern('categories*');
      await this.redisCacheService.del(`categories${slug}`);

      const saved = await newCategory.save();

      return {
        status: StatusType.Success,
        result: saved,
      };
    } catch (err) {
      if (err.code === 11000) {
        throw new BadRequestException({
          message: Message.ThisCategoryAlreadyExists,
          error: Error.CATEGORY_ALREADY_EXISTS,
        });
      }
      throw err;
    }
  }

  async findBySlug(slug: string): Promise<DetailResponse> {
    const cacheKey = `blog_${slug}`;
    const cached = await this.redisCacheService.get<DetailResponse>(cacheKey);

    if (cached) {
      this.logger.log(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    const category = await this.categoryModel.findOne({ slug }).lean();
    if (!category) {
      throw new BadRequestException({
        statusCode: StatusCode.NotFound,
        message: Message.CategoryNotFound,
        error: Error.NOT_FOUND,
      });
    }
    const categoryData = {
      _id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };

    const result = toDataResponse(categoryData);
    await this.redisCacheService
      .set(cacheKey, result, 3600)
      .catch((err) => this.logger.error(`Failed to cache ${cacheKey}`, err));

    return {
      status: 'success',
      result: result,
    };
  }

  async validateCategories(categoryIds: string): Promise<boolean> {
    try {
      const service = await this.categoryModel.findById(categoryIds).exec();
      return !!service; // Returns true if service exists, false otherwise
    } catch (error) {
      this.logger.error(`Error validating service: ${error.message}`);
      return false;
    }
  }

  async updateStatus(
    id: string,
    status: CategoryStatus
  ): Promise<CategoryDocument> {
    if (!Object.values(CategoryStatus).includes(status)) {
      throw new BadRequestException({
        statusCode: StatusCode.BadRequest,
        message: Message.InvalidStatus,
        error: Error.INVALID_STATUS,
      });
    }

    const service = await this.categoryModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!service) {
      throw new BadRequestException({
        statusCode: StatusCode.BadRequest,
        message: Message.CategoryNotFound,
        error: Error.NOT_FOUND,
      });
    }
    await this.redisCacheService.reset();

    return service;
  }

  async delete(_id: string): Promise<void> {
    const result = await this.categoryModel.findByIdAndDelete(_id);

    if (result) {
      await this.redisCacheService.delByPattern('categories*');
      await this.redisCacheService.del(`categories${_id}`);
    } else {
      throw new BadRequestException({
        statusCode: StatusCode.BadRequest,
        message: Message.CategoryNotFound,
        error: Error.CATEGORY_NOT_FOUND,
      });
    }
  }

  async update(
    _id: string,
    updateData: { name: string },
    user: UserData
  ): Promise<CategoryDocument> {
    // Find existing category
    const category = await this.categoryModel.findById(_id);
    if (!category) {
      throw new BadRequestException({
        statusCode: StatusCode.NotFound,
        message: Message.CategoryNotFound,
        error: 'Not Found',
      });
    }

    // Validate input
    if (!updateData.name) {
      throw new BadRequestException({
        statusCode: StatusCode.BadRequest,
        message: Error.CategoryRequired,
        error: 'Bad Request',
      });
    }

    const normalizedName = updateData.name.trim();
    if (normalizedName === category.name) {
      return category;
    }

    // Check for duplicate name
    const existingCategory = await this.categoryModel.findOne({
      _id: { $ne: _id },
      name: normalizedName,
    });

    if (existingCategory) {
      throw new BadRequestException({
        statusCode: StatusCode.Conflict,
        message: Message.ThisCategoryAlreadyExists,
        error: 'Conflict',
      });
    }
    try {
      // Instead of directly assigning to updatedAt, use updateOne
      const updateResult = await this.categoryModel.findByIdAndUpdate(
        _id,
        {
          $set: {
            name: normalizedName,
            slug: this.slugProvider.generateSlug(normalizedName, {
              unique: true,
            }),
            user: {
              userId: user._id,
              username: user.username,
              role: user.role,
            },
          },
        },
        { new: true }
      );

      if (!updateResult) {
        throw new BadRequestException({
          statusCode: StatusCode.NotFound,
          message: Message.CategoryNotFound,
          error: 'Not Found',
        });
      }

      await this.redisCacheService.reset();
      return updateResult;
    } catch (err) {
      if (err.code === 11000) {
        throw new BadRequestException({
          statusCode: StatusCode.Conflict,
          message: Message.ThisCategoryAlreadyExists,
          error: 'Conflict',
        });
      }
      throw new BadRequestException({
        statusCode: StatusCode.ServerError,
        message: Error.InternalServer,
        error: 'Internal Server Error',
      });
    }
  }
}
