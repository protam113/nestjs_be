import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ContactDocument } from './contact.interface';
import { ContactEntity } from '../../entities/contact.entity';
import { Pagination } from '../paginate/pagination';
import { PaginationOptionsInterface } from '../paginate/pagination.options.interface';
import { Error } from './contact.constant';
import { EmailService } from '../../services/email.service';
import { DataResponse } from './responses/data.response';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { UserData } from '../user/user.interface';
import { RedisCacheService } from '../cache/redis-cache.service';
import { buildCacheKey } from '../../utils/cache-key.util';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    @InjectModel(ContactEntity.name)
    private readonly contactModel: Model<ContactDocument>,
    private readonly emailService: EmailService,
    private readonly redisCacheService: RedisCacheService
  ) {}

  async findAll(
    options: PaginationOptionsInterface,
    startDate?: string,
    endDate?: string,
    status?: string
  ): Promise<Pagination<DataResponse>> {
    const cacheKey = buildCacheKey('contacts', {
      page: options.page,
      limit: options.limit,
      start: startDate,
      end: endDate,
      status: status || 'all',
    });
    const cached =
      await this.redisCacheService.get<Pagination<DataResponse>>(cacheKey);

    if (cached) {
      this.logger.log(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    const filter: any = {};

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (status) {
      // Trim whitespace and convert to lowercase
      const normalizedStatus = status.trim().toLowerCase();
      filter.status = normalizedStatus;
    }

    const contacts = await this.contactModel
      .find(filter)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean();

    const total = await this.contactModel.countDocuments(filter);

    const results = contacts.map((contact) => ({
      _id: contact._id,
      name: contact.name,
      email: contact.email,
      phone_number: contact.phone_number,
      link: contact.link,
      services: contact.services,
      status: contact.status,
      createdAt: contact.createdAt || new Date(),
      updatedAt: contact.updatedAt || new Date(),
    })) as DataResponse[];

    const result = new Pagination<DataResponse>({
      results,
      total,
      total_page: Math.ceil(total / options.limit),
      page_size: options.limit,
      current_page: options.page,
    });

    await this.redisCacheService.set(cacheKey, result, 3600).catch(() => null);
    return result;
  }

  async findOne(_id: string): Promise<ContactDocument> {
    const faq = await this.contactModel.findById(_id).lean().exec();
    if (!faq) {
      throw new NotFoundException('FAQ not found');
    }
    return faq;
  }

  async delete(_id: string): Promise<void> {
    const result = await this.contactModel.findByIdAndDelete(_id);
    if (!result) {
      throw new NotFoundException(Error.NotFound);
    }
  }

  async created(createContactDto: CreateContactDto): Promise<ContactDocument> {
    if (
      !createContactDto ||
      !createContactDto.name ||
      !createContactDto.email ||
      !createContactDto.message
    ) {
      throw new BadRequestException('Name, email and message are required');
    }

    const newContact = new this.contactModel({
      ...createContactDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedContact = await newContact.save();

    // ✅ Gửi email cảm ơn qua EmailService
    try {
      await this.emailService.sendThankYouEmail({
        recipientEmail: createContactDto.email,
        name: createContactDto.name,
      });
      this.logger.log(
        `Thank you email has been sent ${createContactDto.email}`
      );
    } catch (error) {
      this.logger.error(`Error sending email: ${error.message}`);
    }

    return savedContact;
  }

  async update(
    id: string,
    updateContactDto: UpdateContactDto,
    user: UserData
  ): Promise<ContactDocument> {
    const contact = await this.contactModel.findById(id);
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    const updatedContact = await this.contactModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            ...updateContactDto,
            updatedAt: new Date(),
            user: {
              userId: user._id,
              username: user.username,
              role: user.role,
            },
          },
        },
        { new: true }
      )
      .exec();

    if (!updatedContact) {
      throw new NotFoundException(Error.NotFound);
    }

    return updatedContact;
  }
}
