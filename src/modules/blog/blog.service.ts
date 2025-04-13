import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
// Pagination
import { Pagination } from '../paginate/pagination';
import { PaginationOptionsInterface } from '../paginate/pagination.options.interface';

// Cache
import { RedisCacheService } from '../cache/redis-cache.service';
import { buildCacheKey } from '../../utils/cache-key.util';

// UserData
import { UserData } from '../user/user.interface';

// Entity
import { BlogDocument, BlogEntity } from '../../entities/blog.entity';

// Components
import { SlugProvider } from '../slug/slug.provider';
import { CategoryService } from '../category/category.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { DataResponse, DetailResponse } from './responses/data.response';
import { Error } from './blog.constant';
import { BlogStatus } from './blog.constant';

@Injectable()

/**
 * ==========================
 * 📌 Blog Service Definition
 * ==========================
 *
 * @description Service layer for managing blog operations with caching support
 *
 * @class BlogService
 * @injectable
 *
 * @dependencies
 * - BlogModel (MongoDB model)
 * - SlugProvider (For URL-friendly slug generation)
 * - CategoryService (For category validation)
 * - RedisCacheService (For caching responses)
 */
export class BlogService {
  private readonly logger = new Logger(BlogService.name);

  constructor(
    @InjectModel(BlogEntity.name)
    private readonly blogModel: Model<BlogDocument>,
    private readonly slugProvider: SlugProvider,
    private readonly categoryService: CategoryService,
    private readonly redisCacheService: RedisCacheService
  ) {}

  /**
   * @methods
   */

  /**
   * @GET /blogs
   * @summary Retrieves a paginated list of blog posts with optional filters
   *
   * @param {PaginationOptionsInterface} options - Pagination settings (page, limit)
   * @param {string} [startDate] - Optional filter: start of creation date range
   * @param {string} [endDate] - Optional filter: end of creation date range
   * @param {BlogStatus} [status] - Optional filter by blog status
   * @param {string} [category] - Optional filter by category ID
   *
   * @returns {Promise<Pagination<DataResponse>>} - Paginated list of blogs
   *
   * @throws {InternalServerErrorException} - If database query fails
   *
   * @cache TTL: 1 hour (3600 seconds)
   *
   * @sideEffect - Uses and writes to Redis cache
   *
   * @example
   * await blogService.findAll({ page: 1, limit: 10 }, '2024-01-01', '2024-12-31', 'SHOW', 'tech');
   */

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

    if (category) {
      // Remove ObjectId conversion since we're using UUID
      filter.category = category;
    }

    const [blogs, total] = await Promise.all([
      this.blogModel
        .find(filter)
        .populate('category', '_id name')
        .sort({ createdAt: -1 })
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

  /**
   * @POST /blogs
   * @summary Creates a new blog post
   *
   * @param {CreateBlogDto} createBlogDto - Data used to create the blog
   * @param {UserData} user - The user who is creating the blog
   * @returns {Promise<BlogDocument>} - The created blog document
   *
   * @throws {BadRequestException} - If a blog with the same title or slug already exists
   * @throws {BadRequestException} - If any provided category ID is invalid
   *
   * @sideEffect - Generates a unique slug for the blog, validates categories
   *
   * @example
   * await blogService.create({
   *   title: 'My Blog',
   *   content: 'Hello world!',
   *   category: ['tech']
   * }, currentUser);
   */

  async create(
    createBlogDto: CreateBlogDto,
    user: UserData
  ): Promise<BlogDocument> {
    const { title, content, description, category, status } = createBlogDto;
    const slug = this.slugProvider.generateSlug(title, { unique: true });

    const blogExists = await this.blogModel.findOne({
      $or: [{ title }, { slug }],
    });
    if (blogExists) {
      throw new BadRequestException(Error.ThisBlogAlreadyExists);
    }

    let categoryIds: string[] = [];
    if (category?.length) {
      const valid = await this.categoryService.validateCategories(category);
      if (!valid) {
        throw new BadRequestException(Error.InvalidCategoryUUIDs);
      }
      categoryIds = category;
    }

    const newBlog = new this.blogModel({
      title,
      slug,
      content,
      description,
      category: categoryIds,
      status: status || BlogStatus.Show, // Use provided status or default to Show
      user: {
        userId: user._id,
        username: user.username,
        role: user.role,
      },
    });

    await this.redisCacheService.reset();
    return await newBlog.save();
  }

  /**
   * @DELETE /blogs/:id
   * @summary Deletes a blog post by its ID
   *
   * @param {string} id - The ID of the blog post to delete
   * @returns {Promise<void>} - Resolves if deletion is successful
   *
   * @throws {NotFoundException} - If no blog post is found with the given ID
   *
   * @sideEffect - Clears the blog cache after deletion
   *
   * @example
   * await blogService.delete('660123abc...');
   */

  async delete(id: string): Promise<void> {
    const result = await this.blogModel.findByIdAndDelete(id);
    await this.redisCacheService.reset();
    if (!result) throw new NotFoundException(Error.BlogNotFound);
  }

  /**
   * @GET /blogs/:slug
   * @summary Retrieves a single blog post by its slug
   *
   * @param {string} slug - The URL-friendly identifier (slug) of the blog
   * @returns {Promise<DataResponse>} - The blog data wrapped in a standard response format
   *
   * @throws {NotFoundException} - If no blog post is found with the given slug
   *
   * @cache TTL: 1 hour (3600 seconds)
   *
   * @sideEffect - Logs cache status and sets cache if not found
   *
   * @example
   * const blog = await blogService.findBySlug('how-to-code-clean');
   */

  async findBySlug(slug: string): Promise<DetailResponse> {
    const cacheKey = `blog_${slug}`;
    const cached = await this.redisCacheService.get<DetailResponse>(cacheKey);

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

    return {
      status: 'success',
      data: result,
    };
  }

  /**
   * @private
   * @summary Maps a blog document to a standardized response DTO
   *
   * @param {any} blog - The raw blog document (from database)
   * @returns {DataResponse} - The transformed blog data for client consumption
   *
   * @note This is an internal helper, used to abstract away database structure
   */

  private mapToDataResponse(blog: any): DataResponse {
    return {
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
    };
  }
}
