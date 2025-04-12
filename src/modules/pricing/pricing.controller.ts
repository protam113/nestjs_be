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
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { PricingService } from './pricing.service';
import { SystemLogService } from '../system-log/system-log.service';
import { CreatePricingDto } from './dto/create-pricing.dto';
import { Status, SystemLogType } from '../../entities/system-log.entity';

@Controller('pricing')
export class PricingController {
  private readonly logger = new Logger(PricingController.name);

  constructor(
    private readonly pricingService: PricingService,
    private readonly systemLogService: SystemLogService
  ) {}

  @Get()
  async getPricings(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    this.logger.debug('Fetching pricings with filters:', {
      startDate,
      endDate,
      status,
      page,
      limit,
    });

    const options = {
      page,
      limit,
    };

    return this.pricingService.findAll(options, startDate, endDate, status);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createPricingDto: CreatePricingDto, @Req() req) {
    const pricing = await this.pricingService.created(
      createPricingDto,
      req.user
    );

    await this.systemLogService.log({
      type: SystemLogType.PricingCreated,
      note: `User ${req.user.email} created a new PRICING.`,
      status: Status.Success,
      data: {
        user: req.user,
        id: pricing._id,
        title: pricing.title,
      },
    });

    return pricing;
  }

  @Get('/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.pricingService.findBySlug(slug);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.pricingService.findByUuid(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateData: { title: string; description?: string },
    @Req() req
  ) {
    const updatedPricing = await this.pricingService.update(
      id,
      updateData,
      req.user
    );

    await this.systemLogService.log({
      type: SystemLogType.PricingUpdated,
      note: `User ${req.user.email} updated PRICING ${id}`,
      status: Status.Success,
      data: {
        user: req.user,
        id: updatedPricing._id,
        title: updatedPricing.title,
        changes: updateData,
      },
    });

    return updatedPricing;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @Req() req) {
    await this.pricingService.delete(id);

    await this.systemLogService.log({
      type: SystemLogType.PricingDeleted,
      note: `User ${req.user.email} deleted PRICING ${id}`,
      status: Status.Success,
      data: {
        user: req.user,
        id,
      },
    });

    return {
      status: 'success',
      message: 'Pricing deleted successfully',
    };
  }
}
