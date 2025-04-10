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
import { ContactService } from './contact.service';
import { SystemLogService } from '../system-log/system-log.service';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { Status, SystemLogType } from 'src/entities/system-log.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Controller('contact')
export class ContactController {
  private readonly logger = new Logger(ContactController.name);

  constructor(
    private readonly contactService: ContactService,
    private readonly systemLogService: SystemLogService // inject SystemLogService ở đây
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getContacts(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<any> {
    this.logger.debug('Fetching users with filters:', {
      startDate,
      endDate,
      page,
      limit,
    });

    const options = {
      page,
      limit,
    };

    return this.contactService.findAll(options, startDate, endDate);
  }

  @Post()
  async create(@Body() createFaqDto: CreateContactDto) {
    const contact = await this.contactService.created(createFaqDto);

    await this.systemLogService.log({
      type: SystemLogType.SentMail,
      note: `Contact form submitted by ${contact.name}`,
      status: Status.Success,
      data: {
        id: contact._id,
        name: contact.name,
        mail: contact.email,
        phone: contact.phone_number,
      },
    });

    return contact;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactDto,
    @Req() req
  ) {
    const contact = await this.contactService.update(
      id,
      updateContactDto,
      req.user
    );

    await this.systemLogService.log({
      type: SystemLogType.UpdateStatus,
      note: `Contact status updated by ${req.user.username}`,
      status: Status.Success,
      data: {
        id: contact._id,
        status: contact.status,
        updatedBy: req.user.username,
      },
    });

    return contact;
  }
}
