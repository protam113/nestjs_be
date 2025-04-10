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
} from '@nestjs/common';
import { FaqService } from './faq.service';
import { CreateFaqDto, UpdateFaqDto, FaqFilterQuery } from './faq.interface';
import { SystemLogService } from '../system-log/system-log.service';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { Status, SystemLogType } from 'src/entities/system-log.entity';

@Controller('faqs')
export class FaqController {
  private readonly logger = new Logger(FaqController.name);

  constructor(
    private readonly faqService: FaqService,
    private readonly systemLogService: SystemLogService // inject SystemLogService ở đây
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createFaqDto: CreateFaqDto, @Req() req) {
    const faq = await this.faqService.created(createFaqDto, req.user);

    await this.systemLogService.log({
      type: SystemLogType.FaqCreated,
      note: `User ${req.user.email} created a new FAQ.`,
      status: Status.Success,

      data: {
        user: req.user,
        faqId: faq._id,
        title: faq.question,
      },
    });

    return faq;
  }

  @Get()
  async findAll(@Query() filter: Partial<FaqFilterQuery>) {
    const paginationOptions = {
      page: Number(filter.page) || 1,
      limit: Number(filter.limit) || 10,
      status: filter.status,
    };
    return await this.faqService.findAll(paginationOptions);
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
}
