import { SlugProvider } from '../slug/slug.provider';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CategoryEntity } from '../../entities/category.entity';
import { Model } from 'mongoose';

import { Pagination } from '../paginate/pagination';
import { PaginationOptionsInterface } from '../paginate/pagination.options.interface';
import { CategoryDocument } from './category.interface';
import { DataResponse } from './responses/data.response';
import { Error, StatusCode } from './category.constant';
import { UserData } from '../user/user.interface';
import { CreateCategoryDto } from './dto/create-category.dto';
import { RedisCacheService } from '../cache/redis-cache.service';
import { buildCacheKey } from '../../utils/cache-key.util';

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
    endDate?: string
  ): Promise<Pagination<CategoryEntity>> {
    const cacheKey = buildCacheKey('categories', {
      page: options.page,
      limit: options.limit,
      start: startDate,
      end: endDate,
    });
    const cached =
      await this.redisCacheService.get<Pagination<CategoryEntity>>(cacheKey);

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

    const categories = await this.categoryModel
      .find(filter)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean();

    const total = await this.categoryModel.countDocuments(filter);

    const mappedCategories = categories.map((category) => ({
      _id: category._id,
      name: category.name,
      slug: category.slug,
      createdAt: category.createdAt || new Date(),
      updatedAt: category.updatedAt || new Date(),
    })) as CategoryEntity[];

    const result = new Pagination<CategoryEntity>({
      results: mappedCategories,
      total,
      total_page: Math.ceil(total / options.limit),
      page_size: options.limit,
      current_page: options.page,
    });

    await this.redisCacheService.set(cacheKey, result, 3600).catch(() => null);
    return result;
  }

  async created(
    createCategoryDto: CreateCategoryDto,
    user: UserData
  ): Promise<CategoryDocument> {
    const { name } = createCategoryDto;

    const slug = this.slugProvider.generateSlug(name, { unique: true });

    const existingCategory = await this.categoryModel.findOne({
      $or: [{ name }, { slug }],
    });

    if (existingCategory) {
      throw new BadRequestException(Error.ThisCategoryAlreadyExists);
    }

    // ✅ Tạo category mới
    const newCategory = new this.categoryModel({
      name,
      slug,
      user: {
        userId: user._id,
        username: user.username,
        role: user.role,
      },
    });

    try {
      const saved = await newCategory.save();

      await this.redisCacheService.reset();

      return saved;
    } catch (err) {
      if (err.code === 11000) {
        throw new BadRequestException(Error.ThisCategoryAlreadyExists);
      }
      throw err;
    }
  }

  private mapToDataResponse(category: any): DataResponse {
    const { _id, name, slug } = category;
    return {
      status: 'success',
      result: {
        _id,
        name,
        slug,
      },
    };
  }

  async findBySlug(slug: string): Promise<DataResponse> {
    const cacheKey = `blog_${slug}`;
    const cached = await this.redisCacheService.get<DataResponse>(cacheKey);

    if (cached) {
      this.logger.log(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    const category = await this.categoryModel.findOne({ slug }).lean();
    if (!category) {
      throw new BadRequestException({
        statusCode: StatusCode.NotFound,
        message: Error.CategoryNotFound,
        error: 'Not Found',
      });
    }

    const result = this.mapToDataResponse(category);
    await this.redisCacheService
      .set(cacheKey, result, 3600)
      .catch((err) => this.logger.error(`Failed to cache ${cacheKey}`, err));

    return result;
  }

  async findByUuid(_id: string): Promise<DataResponse | null> {
    const user = await this.categoryModel.findById(_id).lean();
    if (!user) {
      return null;
    }
    const response = this.mapToDataResponse(user);
    return response;
  }

  async validateCategories(categoryIds: string[]): Promise<boolean> {
    if (!categoryIds || categoryIds.length === 0) {
      return true;
    }

    const categories = await this.categoryModel
      .find({
        _id: { $in: categoryIds },
      })
      .lean();

    // Check if all provided category IDs exist
    return categories.length === categoryIds.length;
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
        message: Error.CategoryNotFound,
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
        message: Error.ThisCategoryAlreadyExists,
        error: 'Conflict',
      });
    }

    try {
      category.name = normalizedName;
      category.slug = this.slugProvider.generateSlug(normalizedName, {
        unique: true,
      });
      category.updatedAt = new Date();
      category.user = {
        userId: user._id,
        username: user.username,
        role: user.role,
      };

      const updatedCategory = await category.save();
      await this.redisCacheService.reset();
      return updatedCategory;
    } catch (err) {
      if (err.code === 11000) {
        throw new BadRequestException({
          statusCode: StatusCode.Conflict,
          message: Error.ThisCategoryAlreadyExists,
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
