import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Logger,
  UseGuards,
  Query,
  Req,
  BadRequestException,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { CategoryService } from './category.service';
import { SystemLogService } from '../system-log/system-log.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Status, SystemLogType } from '../../entities/system-log.entity';
import { StatusCode } from './category.constant';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('category')
export class CategoryController {
  private readonly logger = new Logger(CategoryController.name);

  constructor(
    private readonly categoryService: CategoryService,
    private readonly systemLogService: SystemLogService // inject SystemLogService ở đây
  ) {}

  @Get()
  async getCategories(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<any> {
    this.logger.debug('Fetching users with filters:', {
      startDate,
      endDate,
      page,
      limit,
    });

    const options = {
      page,
      limit,
    };

    return this.categoryService.findAll(options, startDate, endDate);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor(''))
  async create(@Body() createFaqDto: CreateCategoryDto, @Req() req) {
    const category = await this.categoryService.created(createFaqDto, req.user);

    await this.systemLogService.log({
      type: SystemLogType.CategoryCreated,
      note: `User ${req.user.email} created a new CATEGORY.`,
      status: Status.Success,
      data: {
        user: req.user,
        id: category._id,
        title: category.name,
      },
    });

    return category;
  }

  @Get('/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const category = await this.categoryService.findBySlug(slug);
    if (!category) {
      throw new BadRequestException({
        statusCode: StatusCode.ServerError,
        message: 'Category not found',
        error: 'Not Found',
      });
    }
    return category;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateData: { name: string },
    @Req() req
  ) {
    const updatedCategory = await this.categoryService.update(
      id,
      updateData,
      req.user
    );

    await this.systemLogService.log({
      type: SystemLogType.CategoryUpdated,
      note: `User ${req.user.email} updated CATEGORY ${id}`,
      status: Status.Success,
      data: {
        user: req.user,
        id: updatedCategory._id,
        title: updatedCategory.name,
        changes: updateData,
      },
    });

    return updatedCategory;
  }
}
