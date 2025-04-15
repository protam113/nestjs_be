import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { SeoService } from './seo.service';
import { UpdateSeoDto } from './dto/update-seo.dto';
import { Role } from '../../common/enums/role.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/RolesGuard';
import { FileInterceptor } from '@nestjs/platform-express';
import { SystemLogService } from '../system-log/system-log.service';
import { Status, SystemLogType } from 'src/entities/system-log.entity';

@Controller('seo')
export class SeoController {
  constructor(
    private readonly seoService: SeoService,
    private readonly systemLogService: SystemLogService
  ) {}

  @Get()
  async getSeoData() {
    return this.seoService.getSeoData();
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(FileInterceptor(''))
  @Roles(Role.Admin)
  @Roles(Role.Admin)
  async updateSeoData(@Body() updateSeoDto: UpdateSeoDto, @Req() req) {
    await this.systemLogService.log({
      type: SystemLogType.SeoUpdated,
      note: `User ${req.user.email} created a new blog post`,
      status: Status.Success,
      data: {
        user: req.user,
      },
    });

    return this.seoService.updateSeoData(updateSeoDto);
  }
}
