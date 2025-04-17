import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Logger,
  UseGuards,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { FaqService } from './faq.service';
import { FaqFilterQuery } from './faq.interface';
import { SystemLogService } from '../system-log/system-log.service';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { Status, SystemLogType } from '../../entities/system-log.entity';
import { CreateFaqDto } from './dto/create_faq.dto';
import { UpdateFaqDto } from './dto/update_faq.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from '../auth/guards/RolesGuard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { FaqStatus } from './faq.constant';

@Controller('faqs')
export class FaqController {
  private readonly logger = new Logger(FaqController.name);

  constructor(
    private readonly faqService: FaqService,
    private readonly systemLogService: SystemLogService // inject SystemLogService ở đây
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor(''))
  async create(@Body() createFaqDto: CreateFaqDto, @Req() req) {
    const faq = await this.faqService.created(createFaqDto, req.user);

    await this.systemLogService.log({
      type: SystemLogType.FaqCreated,
      note: `User ${req.user.email} created a new FAQ.`,
      status: Status.Success,

      data: {
        user: req.user,
        faqId: faq.result._id,
        title: faq.result.question,
      },
    });

    return faq;
  }

  @Get()
  async findAll(@Query() filter: Partial<FaqFilterQuery>) {
    const paginationOptions = {
      page: Number(filter.page) || 1,
      limit: Number(filter.limit) || 10,
    };

    return await this.faqService.findAll(
      paginationOptions,
      filter.startDate,
      filter.endDate,
      filter.status
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.faqService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateFaqDto: UpdateFaqDto,
    @Req() req
  ) {
    return await this.faqService.update(id, updateFaqDto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string) {
    return await this.faqService.delete(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @UseInterceptors(FileInterceptor(''))
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: FaqStatus
  ) {
    return this.faqService.updateStatus(id, status);
  }
}
