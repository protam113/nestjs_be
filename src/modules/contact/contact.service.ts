import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ContactDocument, ContactEntity } from '../../entities/contact.entity';

// Pagination
import { Pagination } from '../paginate/pagination';
import { PaginationOptionsInterface } from '../paginate/pagination.options.interface';

import { Error, ContactStatus } from './contact.constant';
import { EmailService } from '../../services/email.service';
import { DataResponse } from './responses/data.response';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { UserData } from '../user/user.interface';
import { RedisCacheService } from '../cache/redis-cache.service';
import { buildCacheKey } from '../../utils/cache-key.util';
import { ServiceService } from '../service/service.service';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    @InjectModel(ContactEntity.name)
    private readonly contactModel: Model<ContactDocument>,
    private readonly emailService: EmailService,
    private readonly redisCacheService: RedisCacheService,
    private readonly serviceService: ServiceService
  ) {}

  async findAll(
    options: PaginationOptionsInterface,
    startDate?: string,
    endDate?: string,
    status?: ContactStatus,
    service?: string
  ): Promise<Pagination<DataResponse>> {
    const cacheKey = buildCacheKey('contacts', {
      page: options.page,
      limit: options.limit,
      start: startDate,
      end: endDate,
      status: status || 'all',
      service: service || 'all',
    });

    const cached =
      await this.redisCacheService.get<Pagination<DataResponse>>(cacheKey);
    if (cached) {
      this.logger.log(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    const filter: any = {};

    if (startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // Improved status filtering
    if (status) {
      // Log the incoming status for debugging
      this.logger.debug(`Filtering by status: ${status}`);

      if (!Object.values(ContactStatus).includes(status)) {
        throw new BadRequestException(
          `Invalid status. Valid values are: ${Object.values(ContactStatus).join(', ')}`
        );
      }
      filter.status = status;
    }

    if (service) {
      if (service === 'null') {
        // Filter for contacts with null service
        filter.service = null;
      } else {
        try {
          // Filter for specific service ID
          filter.service = service;
        } catch (e) {
          throw new BadRequestException('Invalid service ID format');
        }
      }
    }

    const [contacts, total] = await Promise.all([
      this.contactModel
        .find(filter)
        .populate({
          path: 'service',
          select: '_id title',
          model: 'ServiceEntity',
        })
        .sort({ createdAt: 'desc' }) // Changed to 'desc' for newest first
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .lean(),
      this.contactModel.countDocuments(filter),
    ]);

    const results = contacts.map(this.mapToDataResponse);
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
      throw new NotFoundException(Error.NotFound);
    }
    return faq;
  }

  async delete(_id: string): Promise<void> {
    const result = await this.contactModel.findByIdAndDelete(_id);
    await this.redisCacheService.reset();

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
      throw new BadRequestException(Error.DataRequired);
    }
    const { service, phone_number, email, message, name } = createContactDto;

    // Initialize serviceId as undefined
    let serviceId: string | undefined;

    if (service) {
      try {
        // Add logging to debug service validation
        this.logger.debug(`Validating service ID: ${service}`);

        const valid = await this.serviceService.validateService(service);
        this.logger.debug(`Validation result: ${valid}`);

        if (!valid) {
          throw new BadRequestException(Error.ServiceNotFound);
        }
        serviceId = service;
      } catch (error) {
        this.logger.error(`Service validation error: ${error.message}`);
        throw new BadRequestException(
          `${Error.ServiceValidation}: ${error.message}`
        );
      }
    }

    const newContact = new this.contactModel({
      name,
      email,
      phone_number,
      message,
      service: serviceId, // Use single service ID
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedContact = await newContact.save();

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
    await this.redisCacheService.reset();
    return savedContact;
  }

  async update(
    id: string,
    updateContactDto: UpdateContactDto,
    user: UserData
  ): Promise<ContactDocument> {
    const contact = await this.contactModel.findById(id);
    if (!contact) {
      throw new NotFoundException(Error.NotFound);
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
    await this.redisCacheService.reset();
    return updatedContact;
  }

  /**
   * @private
   * @summary Maps a contact document to a standardized response DTO
   *
   * @param {any} contact - The raw contact document (from database)
   * @returns {DataResponse} - The transformed contact data for client consumption
   *
   * @note This is an internal helper, used to abstract away database structure
   */

  private mapToDataResponse(contact: any): DataResponse {
    return {
      _id: contact._id,
      name: contact.name,
      email: contact.email,
      phone_number: contact.phone_number,
      message: contact.message,
      link: contact.link,
      service: contact.service,
      status: contact.status,
      createdAt: contact.createdAt ?? new Date(),
      updatedAt: contact.updatedAt ?? new Date(),
    };
  }
}
