import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SystemLogService } from './system-log.service';
import { SystemLogType } from '../../entities/system-log.entity';
import { RolesGuard } from '../auth/guards/RolesGuard';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { PaginationOptionsInterface } from '../paginate/pagination.options.interface';

@Controller('logs')
export class SystemLogController {
  constructor(private readonly systemLogService: SystemLogService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async getLogs(
    @Query('type') type?: SystemLogType,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    if (type) {
      return await this.systemLogService.findByType(type);
    }

    const paginationOptions: PaginationOptionsInterface = {
      page: +page,
      limit: +limit,
    };

    return await this.systemLogService.findAll(
      paginationOptions,
      startDate,
      endDate
    );
  }

  @Get('/latest-user-statistic')
  async getLatestUserStatistic() {
    return await this.systemLogService.findLatestUserStatistic();
  }
}
