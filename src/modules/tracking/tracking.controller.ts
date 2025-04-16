import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { CreateTrackingDto } from './dto/create-tracking.dto';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { Type } from './responses/data.response';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('track')
  @UseInterceptors(FileInterceptor(''))
  async trackView(@Body() createTrackingDto: CreateTrackingDto) {
    return this.trackingService.trackView(createTrackingDto);
  }

  // Endpoint lấy tất cả các bản ghi thống kê
  @Get('')
  @UseGuards(JwtAuthGuard)
  async getAllTrackingData(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('type') type?: Type,
    @Query('sort') sort?: 'asc' | 'desc'
  ) {
    return this.trackingService.findAll(
      { page, limit },
      startDate,
      endDate,
      type as Type,
      sort
    );
  }
}
