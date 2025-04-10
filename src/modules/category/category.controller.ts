import {
  Body,
  Controller,
  Get,
  Post,
  Logger,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { CategoryService } from './category.service';
import { SystemLogService } from '../system-log/system-log.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Status, SystemLogType } from 'src/entities/system-log.entity';

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
}
