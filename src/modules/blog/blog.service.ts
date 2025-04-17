import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

// Service
import { SlugProvider } from '../slug/slug.provider';
import { CategoryService } from '../category/category.service';
import { MediaService } from '../media/media.service';

// Components
import { CreateBlogDto } from './dto/create-blog.dto';
import { DataResponse, DetailResponse } from './responses/data.response';
import { Error, Message } from './blog.constant';
import { BlogStatus } from './blog.constant';
import { toDataResponse } from './blog.mapper';
import { CreateBlogResponse } from './responses/create_blog.response';
import { StatusCode, StatusType } from 'src/entities/status_code.entity';

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
    private readonly redisCacheService: RedisCacheService,
    private readonly mediaService: MediaService
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
    status?: string | BlogStatus,
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

    if (status) {
      const statusArray = status.split(',');
      const validStatuses = statusArray.filter((s) =>
        Object.values(BlogStatus).includes(s as BlogStatus)
      );
      if (validStatuses.length > 0) {
        filter.status = { $in: validStatuses };
      }
    }

    if (category) {
      filter.category = category;
    }

    const [blogs, total] = await Promise.all([
      this.blogModel
        .find(filter)
        .populate('category', '_id name')
        .sort({ createdAt: -1 })
        .skip((options.page - 1) * options.limit)
        .limit(options.limit),
      this.blogModel.countDocuments(filter),
    ]);

    const results = blogs.map(toDataResponse);
    const result = new Pagination<DataResponse>({
      results,
      total,
      total_page: Math.ceil(total / options.limit),
      page_size: options.limit,
      current_page: options.page,
    });

    await this.redisCacheService
      .set(cacheKey, result, 7200)
      .catch((err) =>
        this.logger.warn(`Failed to cache blog list: ${err.message}`)
      );
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
    user: UserData,
    file?: Express.Multer.File
  ): Promise<CreateBlogResponse> {
    const { title, content, description, category, status } = createBlogDto;

    if (!category) {
      throw new BadRequestException({
        message: Message.CATEGORY_REQUIRED,
        code: Error.CATEGORY_REQUIRED,
      });
    }

    const slug = this.slugProvider.generateSlug(title, { unique: true });

    const blogExists = await this.blogModel.findOne({
      $or: [{ title }, { slug }],
    });
    if (blogExists) {
      throw new BadRequestException({
        statusCode: StatusCode.BadRequest,
        message: Message.ThisBlogAlreadyExists,
        error: Error.BLOG_ALREADY_EXISTS,
      });
    }

    // Validate category first
    let validatedCategory: string;
    try {
      const valid = await this.categoryService.validateCategories(category);
      if (!valid) {
        throw new BadRequestException(Message.CategoryNotFound);
      }
      validatedCategory = category;
    } catch (error) {
      throw new BadRequestException({
        statusCode: StatusCode.BadRequest,
        message: Message.CategoryValidation,
        error: Error.CATEGORY_VALIDATION,
      });
    }

    // Handle file upload
    let imageUrl = '';
    if (!file) {
      throw new BadRequestException({
        statusCode: StatusCode.BadRequest,
        message: Message.BlogThumbnailRequired,
        error: Error.FILE_REQUIRED,
      });
    }

    try {
      const uploadedImage = await this.mediaService.uploadFile('/blog', file);
      imageUrl = uploadedImage.url;
    } catch (error) {
      throw new BadRequestException({
        message: Message.FailedUploadImage,
        details: error.message,
      });
    }

    const newBlog = new this.blogModel({
      title,
      slug,
      content,
      description,
      category: validatedCategory,
      file: imageUrl,
      status: status || BlogStatus.Draft,
      user: {
        userId: user._id,
        username: user.username,
        role: user.role,
      },
    });

    await this.redisCacheService.reset();
    const savedBlog = await newBlog.save();
    return {
      status: StatusType.Success,
      result: savedBlog,
    };
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
    if (!result)
      throw new BadRequestException({
        statusCode: StatusCode.BadRequest,
        message: Message.BlogNotFound,
        error: Error.BLOG_ALREADY_EXISTS,
      });
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
      .populate('category', '_id name')
      .exec();
    if (!blog) throw new NotFoundException(Message.BlogNotFound);

    const result = toDataResponse(blog);

    await this.redisCacheService
      .set(cacheKey, result, 10800)
      .catch((err) => this.logger.error(`Failed to cache ${cacheKey}`, err));

    return {
      status: 'success',
      result: result,
    };
  }

  /**
   * @PATCH /blogs/:id/status
   * @summary Updates the status of a blog post by its ID
   *
   * @param {string} id - The ID of the blog post to update
   * @param {BlogStatus} status - The new status to set for the blog
   * @returns {Promise<BlogDocument>} - The updated blog document
   *
   * @throws {NotFoundException} - If no blog post is found with the given ID
   * @throws {BadRequestException} - If the provided status is invalid
   *
   * @sideEffect - Clears the blog cache after updating status
   *
   * @example
   * await blogService.updateStatus('660123abc...', BlogStatus.Published);
   */
  async updateStatus(id: string, status: BlogStatus): Promise<BlogDocument> {
    // Kiểm tra tính hợp lệ của status
    if (!Object.values(BlogStatus).includes(status)) {
      throw new BadRequestException(Message.InvalidStatus);
    }

    // Tìm và cập nhật blog
    const blog = await this.blogModel.findByIdAndUpdate(
      id,
      { status },
      { new: true } // Trả về document sau khi cập nhật
    );

    if (!blog) {
      throw new NotFoundException(Message.BlogNotFound);
    }

    // Xóa cache để đảm bảo dữ liệu mới nhất
    await this.redisCacheService
      .reset()
      .catch((err) => this.logger.error('Failed to clear cache:', err));

    return blog;
  }

  async updateView(slug: string, newViews: number): Promise<BlogDocument> {
    // Kiểm tra tính hợp lệ của newViews
    if (newViews < 0) {
      throw new BadRequestException(Message.InvalidViewsCount);
    }

    // Tìm và cập nhật blog theo slug
    const blog = await this.blogModel.findOneAndUpdate(
      { slug }, // Tìm kiếm theo slug thay vì id
      { $inc: { views: newViews } }, // Tăng views bằng cách sử dụng $inc
      { new: true } // Trả về document sau khi cập nhật
    );

    if (!blog) {
      throw new NotFoundException(Message.BlogNotFound);
    }

    // Xóa cache để đảm bảo dữ liệu mới nhất
    await this.redisCacheService
      .reset()
      .catch((err) => this.logger.error('Failed to clear cache:', err));

    return blog;
  }
}
