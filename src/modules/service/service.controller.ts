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
import { ServiceStatus } from './service.constant';
import { CreateServiceDto } from './dto/create-service';
import { ServiceService } from './service.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from '../auth/guards/RolesGuard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('service')
export class ServiceController {
  private readonly logger = new Logger(ServiceController.name);

  constructor(
    private readonly serviceService: ServiceService,
    private readonly systemLogService: SystemLogService
  ) {}

  @Get()
  async getServices(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: ServiceStatus
  ) {
    this.logger.debug('Fetching services with filters:', {
      startDate,
      endDate,
      page,
      limit,
      status,
    });

    return this.serviceService.findAll(
      { page, limit },
      startDate,
      endDate,
      status as ServiceStatus
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() createServiceDto: CreateServiceDto,
    @Req() req,
    @UploadedFile() file: Express.Multer.File
  ) {
    const service = await this.serviceService.create(
      createServiceDto,
      req.user,
      file
    );

    await this.systemLogService.log({
      type: SystemLogType.ServiceCreated,
      note: `User ${req.user.email} created a new service post`,
      status: Status.Success,
      data: {
        user: req.user,
        id: service.result._id,
        title: service.result.title,
      },
    });

    return service;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @Req() req) {
    await this.serviceService.delete(id);

    await this.systemLogService.log({
      type: SystemLogType.ServiceDeleted,
      note: `User ${req.user.name} deleted a service`,
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
    return this.serviceService.findBySlug(slug);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @UseInterceptors(FileInterceptor(''))
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ServiceStatus
  ) {
    return this.serviceService.updateStatus(id, status);
  }
}
