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
import { BlogService } from './blog.service';
import { SystemLogService } from '../system-log/system-log.service';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { CreateBlogDto } from './dto/create-blog.dto';
import { Status, SystemLogType } from '../../entities/system-log.entity';
import { BlogStatus } from './blog.constant';

@Controller('blog')
export class BlogController {
  private readonly logger = new Logger(BlogController.name);

  constructor(
    private readonly blogService: BlogService,
    private readonly systemLogService: SystemLogService
  ) {}

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

  @Get(':slug')
  async getBlogBySlug(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug);
  }
}
