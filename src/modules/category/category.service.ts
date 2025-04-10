import { SlugProvider } from '../slug/slug.provider';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CategoryEntity } from '../../entities/category.entity';
import { Model } from 'mongoose';

import { Pagination } from '../paginate/pagination';
import { PaginationOptionsInterface } from '../paginate/pagination.options.interface';
import { CategoryDocument } from './category.interface';
import { DataResponse } from './responses/data.response';
import { Error } from './category.constant';
import { UserData } from '../user/user.interface';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    @InjectModel(CategoryEntity.name)
    private readonly categoryModel: Model<CategoryDocument>,
    private readonly slugProvider: SlugProvider
  ) {}

  async findAll(
    options: PaginationOptionsInterface,
    startDate?: string,
    endDate?: string
  ): Promise<Pagination<CategoryEntity>> {
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

    return new Pagination<CategoryEntity>({
      results: mappedCategories,
      total,
    });
  }

  async created(
    createCategoryDto: CreateCategoryDto,
    user: UserData
  ): Promise<CategoryDocument> {
    const { name } = createCategoryDto;

    // ✅ Tạo slug từ name
    const slug = this.slugProvider.generateSlug(name, { unique: true });

    // ✅ Kiểm tra trùng tên hoặc slug
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

    // ✅ Lưu category
    try {
      return await newCategory.save();
    } catch (err) {
      // Nếu lỗi do trùng unique (MongoDB index)
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

  async findBySlug(slug: string): Promise<DataResponse | null> {
    const category = await this.categoryModel.findOne({ slug }).lean();
    if (!category) {
      return null;
    }
    const response = this.mapToDataResponse(category);
    return response;
  }

  async findByUuid(_id: string): Promise<DataResponse | null> {
    const user = await this.categoryModel.findById(_id).lean();
    if (!user) {
      return null;
    }
    const response = this.mapToDataResponse(user);
    return response;
  }
}
