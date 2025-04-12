import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { SystemLogService } from '../system-log/system-log.service';
import { Status, SystemLogType } from '../../entities/system-log.entity';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';

import { BlogService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { BlogStatus } from './blog.constant';

@Controller('blog')
export class BlogController {
  private readonly logger = new Logger(BlogController.name);

  constructor(
    private readonly blogService: BlogService,
    private readonly systemLogService: SystemLogService
  ) {}

  /**
   * @GET /blog
   * @summary Retrieves paginated list of blogs with optional filters
   *
   * @queryParam {string} [startDate] - Filter: start date of creation
   * @queryParam {string} [endDate] - Filter: end date of creation
   * @queryParam {number} [page=1] - Page number for pagination
   * @queryParam {number} [limit=10] - Number of items per page
   * @queryParam {BlogStatus} [status] - Filter by blog status
   * @queryParam {string} [category] - Filter by category ID
   *
   * @returns {Promise<Pagination<DataResponse>>} Paginated list of blog posts
   * @throws {InternalServerErrorException} On database or cache error
   *
   * @description
   * Retrieves blogs with support for pagination and filters.
   * Utilizes Redis caching with TTL of 1 hour.
   */
  @Get()
  async getBlogs(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: BlogStatus,
    @Query('category') category?: string
  ) {
    this.logger.debug('Fetching blogs with filters:', {
      startDate,
      endDate,
      page,
      limit,
      status,
      category,
    });

    return this.blogService.findAll(
      { page, limit },
      startDate,
      endDate,
      status as BlogStatus,
      category
    );
  }

  /**
   * @POST /blog
   * @summary Creates a new blog post
   *
   * @bodyParam {CreateBlogDto} createBlogDto - Blog data to be created
   * @auth JWT (JwtAuthGuard)
   *
   * @returns {Promise<BlogDocument>} Created blog post
   * @throws {BadRequestException} If duplicate title/slug or invalid category
   *
   * @sideEffect
   * - Saves blog to database
   * - Logs creation in system logs
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createBlogDto: CreateBlogDto, @Req() req) {
    const blog = await this.blogService.create(createBlogDto, req.user);

    await this.systemLogService.log({
      type: SystemLogType.BlogCreated,
      note: `User ${req.user.email} created a new blog post`,
      status: Status.Success,
      data: {
        user: req.user,
        id: blog._id,
        title: blog.title,
      },
    });

    return blog;
  }

  /**
   * @DELETE /blog/:id
   * @summary Deletes a blog post by ID
   *
   * @param {string} id - Blog post ID to delete
   * @auth JWT (JwtAuthGuard)
   *
   * @returns {Promise<{ message: string }>} Success message
   * @throws {NotFoundException} If blog is not found
   *
   * @sideEffect
   * - Removes blog from DB
   * - Resets blog cache
   * - Logs deletion
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @Req() req) {
    await this.blogService.delete(id);

    await this.systemLogService.log({
      type: SystemLogType.BlogDeleted,
      note: `User ${req.user.name} deleted a blog post`,
      status: Status.Success,
      data: {
        user: req.user,
        blogId: id,
      },
    });

    return { message: 'Blog deleted successfully' };
  }

  /**
   * @GET /blog/:slug
   * @summary Retrieves a blog post by its slug
   *
   * @param {string} slug - Slug (URL-friendly string) of the blog post
   *
   * @returns {Promise<DataResponse>} Blog post data
   * @throws {NotFoundException} If blog is not found
   *
   * @cache TTL: 1 hour (3600 seconds)
   *
   * @description
   * Uses Redis cache to speed up slug-based retrieval.
   */
  @Get(':slug')
  async getBlogBySlug(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug);
  }
}
