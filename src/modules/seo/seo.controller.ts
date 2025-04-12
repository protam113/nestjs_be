import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SeoService } from './seo.service';
import { UpdateSeoDto } from './dto/update-seo.dto';
import { Role } from '../../common/enums/role.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/RolesGuard';

@Controller('seo')
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Get()
  async getSeoData() {
    return this.seoService.getSeoData();
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Roles(Role.Admin)
  async updateSeoData(@Body() updateSeoDto: UpdateSeoDto) {
    return this.seoService.updateSeoData(updateSeoDto);
  }
}
