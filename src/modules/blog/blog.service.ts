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
import { CreateBlogDto } from './dto/create-blog.dto';
import { BlogDocument, BlogEntity } from '../../entities/blog.entity';
import { DataResponse } from './responses/data.response';
import { CategoryService } from '../category/category.service';
import { Error } from './blog.constant';
import { BlogStatus } from './blog.constant';
import { RedisCacheService } from '../cache/redis-cache.service';
import { buildCacheKey } from '../../utils/cache-key.util';

@Injectable()
export class BlogService {
  private readonly logger = new Logger(BlogService.name);

  constructor(
    @InjectModel(BlogEntity.name)
    private readonly blogModel: Model<BlogDocument>,
    private readonly slugProvider: SlugProvider,
    private readonly categoryService: CategoryService,
    private readonly redisCacheService: RedisCacheService
  ) {}

  async findAll(
    options: PaginationOptionsInterface,
    startDate?: string,
    endDate?: string,
    status?: BlogStatus,
    category?: string
  ): Promise<Pagination<DataResponse>> {
    const cacheKey = buildCacheKey('blogs', {
      page: options.page,
      limit: options.limit,
      start: startDate,
      end: endDate,
      status: status || 'all',
      category: category || 'all',
    });
    const cached =
      await this.redisCacheService.get<Pagination<DataResponse>>(cacheKey);

    if (cached) {
      this.logger.log(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    const filter: Record<string, any> = {};
    if (startDate && endDate)
      filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    if (status && Object.values(BlogStatus).includes(status))
      filter.status = status;
    if (category) filter.category = category;

    const [blogs, total] = await Promise.all([
      this.blogModel
        .find(filter)
        .populate('category', 'name')
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .lean(),
      this.blogModel.countDocuments(filter),
    ]);

    const results = blogs.map(this.mapToDataResponse);
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
    createBlogDto: CreateBlogDto,
    user: UserData
  ): Promise<BlogDocument> {
    const { title, content, description, category } = createBlogDto;
    const slug = this.slugProvider.generateSlug(title, { unique: true });

    const blogExists = await this.blogModel.findOne({
      $or: [{ title }, { slug }],
    });
    if (blogExists) throw new BadRequestException(Error.ThisBlogAlreadyExists);

    if (category) {
      const valid = await this.categoryService.validateCategories(category);
      if (!valid)
        throw new BadRequestException('Invalid category IDs provided');
    }

    const newBlog = new this.blogModel({
      title,
      slug,
      content,
      description,
      category,
      status: BlogStatus.Show,
      user: {
        userId: user._id,
        username: user.username,
        role: user.role,
      },
    });

    return await newBlog.save();
  }

  async delete(id: string): Promise<void> {
    const result = await this.blogModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Blog not found');
  }

  async findBySlug(slug: string): Promise<DataResponse> {
    const cacheKey = `blog_${slug}`;
    const cached = await this.redisCacheService.get<DataResponse>(cacheKey);

    if (cached) {
      this.logger.log(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    const blog = await this.blogModel
      .findOne({ slug })
      .populate('category', 'name')
      .lean();
    if (!blog) throw new NotFoundException(Error.BlogNotFound);

    const result = this.mapToDataResponse(blog);

    await this.redisCacheService
      .set(cacheKey, result, 3600)
      .catch((err) => this.logger.error(`Failed to cache ${cacheKey}`, err));

    return result;
  }

  private mapToDataResponse(blog: any): DataResponse {
    return {
      status: 'success',
      result: {
        _id: blog._id,
        title: blog.title,
        slug: blog.slug,
        content: blog.content,
        description: blog.description,
        link: blog.link,
        category: blog.category,
        status: blog.status,
        createdAt: blog.createdAt ?? new Date(),
        updatedAt: blog.updatedAt ?? new Date(),
      },
    };
  }
}
