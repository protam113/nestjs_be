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
  UseInterceptors,
  UploadedFile,
  Patch,
} from '@nestjs/common';
import { SystemLogService } from '../system-log/system-log.service';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { Status, SystemLogType } from '../../entities/system-log.entity';
import { ProjectStatus } from './project.constant';
import { CreateProjectDto } from './dto/create_project.dto';
import { ProjectService } from './project.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from '../auth/guards/RolesGuard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('project')
export class ProjectController {
  private readonly logger = new Logger(ProjectController.name);

  constructor(
    private readonly projectService: ProjectService,
    private readonly systemLogService: SystemLogService
  ) {}

  @Get()
  async getServices(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: ProjectStatus
  ) {
    this.logger.debug('Fetching services with filters:', {
      startDate,
      endDate,
      page,
      limit,
      status,
    });

    return this.projectService.findAll(
      { page, limit },
      startDate,
      endDate,
      status as ProjectStatus
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @Req() req,
    @UploadedFile() file: Express.Multer.File
  ) {
    const service = await this.projectService.create(
      createProjectDto,
      req.user,
      file
    );

    await this.systemLogService.log({
      type: SystemLogType.ServiceCreated,
      note: `User ${req.user.email} created a new project post`,
      status: Status.Success,
      data: {
        user: req.user,
        id: service._id,
        title: service.title,
      },
    });

    return service;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @Req() req) {
    await this.projectService.delete(id);

    await this.systemLogService.log({
      type: SystemLogType.ServiceDeleted,
      note: `User ${req.user.name} deleted a project`,
      status: Status.Success,
      data: {
        user: req.user,
        serviceId: id,
        serviceName: req.title,
      },
    });

    return { message: 'Service deleted successfully' };
  }

  @Get(':slug')
  async getServiceBySlug(@Param('slug') slug: string) {
    return this.projectService.findBySlug(slug);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @UseInterceptors(FileInterceptor(''))
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ProjectStatus
  ) {
    return this.projectService.updateStatus(id, status);
  }
}
