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
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { CategoryService } from './category.service';
import { SystemLogService } from '../system-log/system-log.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Status, SystemLogType } from '../../entities/system-log.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { StatusCode } from 'src/entities/status_code.entity';
import { CategoryStatus, Error, Message } from './category.constant';
import { RolesGuard } from '../auth/guards/RolesGuard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('category')
export class CategoryController {
  private readonly logger = new Logger(CategoryController.name);

  constructor(
    private readonly categoryService: CategoryService,
    private readonly systemLogService: SystemLogService
  ) {}

  @Get()
  async getCategories(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: CategoryStatus
  ): Promise<any> {
    this.logger.debug('Fetching users with filters:', {
      startDate,
      endDate,
      page,
      limit,
      status,
    });

    const options = {
      page,
      limit,
    };

    return this.categoryService.findAll(
      options,
      startDate,
      endDate,
      status as CategoryStatus
    );
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
        id: category.result._id,
        title: category.result.name,
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
        message: Message.CategoryFound,
        error: Error.NOT_FOUND,
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

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @Req() req) {
    await this.categoryService.delete(id);

    await this.systemLogService.log({
      type: SystemLogType.DeletedContact,
      note: `User ${req.user.name} deleted a category`,
      status: Status.Success,
      data: {
        user: req.user,
        blogId: id,
      },
    });

    return { message: 'Category deleted successfully' };
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @UseInterceptors(FileInterceptor(''))
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: CategoryStatus
  ) {
    return this.categoryService.updateStatus(id, status);
  }
}
