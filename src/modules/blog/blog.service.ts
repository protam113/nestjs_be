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
import { BLOG_CACHE_TTL, Error, Message } from './blog.constant';
import { BlogStatus } from './blog.constant';
import { toDataResponse } from './blog.mapper';
import { CreateBlogResponse } from './responses/create_blog.response';
import { StatusCode, StatusType } from 'src/entities/status_code.entity';
import { buildBlogFilter } from 'src/helpers/blog.helper';

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

    const filter = buildBlogFilter({ startDate, endDate, status, category });

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

    await this.redisCacheService.set(
      cacheKey,
      result,
      BLOG_CACHE_TTL.BLOG_LIST
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

    // Validate category
    if (!category)
      throw new BadRequestException({
        message: Message.CATEGORY_REQUIRED,
        code: Error.CATEGORY_REQUIRED,
      });

    // Validate title
    if (!title || title.trim() === '') {
      throw new BadRequestException({
        message: 'Title is required to generate slug',
        error: Error.TITLE_REQUIRED,
      });
    }

    // Generate unique slug
    const slug = this.slugProvider.generateSlug(title, { unique: true });

    // Check if blog exists or category is valid
    const [exists, isValidCategory] = await Promise.all([
      this.blogModel.findOne({ $or: [{ title }, { slug }] }),
      this.categoryService.validateCategories(category),
    ]);

    if (exists)
      throw new BadRequestException({
        message: Message.ThisBlogAlreadyExists,
        error: Error.BLOG_ALREADY_EXISTS,
      });

    if (!isValidCategory)
      throw new BadRequestException({
        message: Message.CategoryValidation,
        error: Error.CATEGORY_VALIDATION,
      });

    // Validate and upload file
    if (!file)
      throw new BadRequestException({
        message: Message.BlogThumbnailRequired,
        error: Error.FILE_REQUIRED,
      });

    let imageUrl = '';
    try {
      const uploadedImage = await this.mediaService.uploadFile('/blog', file);
      imageUrl = uploadedImage.url;
    } catch (error) {
      throw new BadRequestException({
        message: Message.FailedUploadImage,
        details: error.message,
      });
    }

    // Create blog object
    const newBlog = new this.blogModel({
      title,
      slug,
      content,
      description,
      category,
      file: imageUrl,
      status: status || BlogStatus.Draft,
      user: {
        userId: user._id,
        username: user.username,
        role: user.role,
      },
    });

    try {
      await this.redisCacheService.delByPattern('blogs*');
      this.logger.log('Cleared blog-related cache entries after create');
    } catch (error) {
      this.logger.error('Failed to clear cache after blog creation', error);
    }
    // Save blog and clear cache
    const savedBlog = await newBlog.save();

    // Clear cache related to blogs

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

    if (result) {
      try {
        await Promise.all([
          this.redisCacheService.delByPattern('blogs*'),
          this.redisCacheService.del(`blog_${result.slug}`),
        ]);
        this.logger.log(`Cleared cache for blog ID ${id} and blog lists`);
      } catch (error) {
        this.logger.error(
          `Failed to clear cache after blog deletion: ${error.message}`,
          error.stack
        );
      }
    } else {
      throw new BadRequestException({
        statusCode: StatusCode.BadRequest,
        message: Message.BlogNotFound,
        error: Error.BLOG_NOT_FOUND,
      });
    }
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

    // Check if the data is in cache first
    const cached = await this.redisCacheService.get<DetailResponse>(cacheKey);

    if (cached) {
      this.logger.log(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    // If not in cache, retrieve from the database
    const blog = await this.blogModel
      .findOne({ slug })
      .populate('category', '_id name')
      .exec();

    if (!blog) {
      // Log that no blog was found and throw NotFoundException
      this.logger.warn(`Blog with slug '${slug}' not found`);
      throw new NotFoundException({
        message: Message.BlogNotFound,
        error: Error.BLOG_NOT_FOUND,
      });
    }

    const result = toDataResponse(blog);

    // Cache the blog result for future requests
    await this.redisCacheService.set(
      cacheKey,
      result,
      BLOG_CACHE_TTL.BLOG_DETAIL
    );

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
    if (!Object.values(BlogStatus).includes(status)) {
      throw new BadRequestException({
        message: Message.InvalidStatus,
        error: Error.INVALID_STATUS,
      });
    }

    // Tìm và cập nhật blog
    const blog = await this.blogModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    // Kiểm tra xem blog có tồn tại không
    if (!blog) {
      this.logger.warn(`Blog with ID ${id} not found for status update`);
      throw new NotFoundException({
        message: Message.BlogNotFound,
        error: Error.BLOG_NOT_FOUND,
      });
    }

    // Log thông tin khi cập nhật trạng thái
    this.logger.log(`Blog with ID ${id} updated to status '${status}'`);

    // Xóa cache để đảm bảo dữ liệu mới nhất
    await this.redisCacheService.delByPattern('blogs*');
    await this.redisCacheService.del(`blog_${id}`);

    return blog;
  }

  async updateView(slug: string, newViews: number): Promise<BlogDocument> {
    // Kiểm tra số lượt xem hợp lệ
    if (newViews < 0) {
      throw new BadRequestException({
        message: Message.InvalidViewsCount,
        error: Error.INVALID_VIEWS_COUNT,
      });
    }

    // Cập nhật lượt xem
    const blog = await this.blogModel.findOneAndUpdate(
      { slug },
      { $inc: { views: newViews } },
      { new: true } // Trả về blog sau khi cập nhật
    );

    // Nếu không tìm thấy blog
    if (!blog) {
      this.logger.warn(`Blog with slug ${slug} not found for view update`);
      throw new NotFoundException({
        message: Message.BlogNotFound,
        error: Error.BLOG_NOT_FOUND,
      });
    }

    // Log thông tin khi cập nhật lượt xem
    this.logger.log(`Blog with slug '${slug}' updated views by ${newViews}`);

    // Xóa cache để đảm bảo dữ liệu mới nhất
    await this.redisCacheService.delByPattern('blogs*');
    await this.redisCacheService.del(`blog_${slug}`);

    return blog;
  }
}
